import sys
import json
import os
import random
from anthropic import Anthropic

# Get API key from environment variable
CLAUDE_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not CLAUDE_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable is required")

# Initialize Claude client at module level (like the working scholarship matcher)
claude_client = Anthropic(api_key=CLAUDE_API_KEY)

class EssayGenerator:
    """Generates scholarship essays using the strategy map and student profiles."""

    def __init__(self, strategy_map_path="python_backend/strategy_map.json"):
        # Use the module-level client
        self.client = claude_client
        self.model = "claude-sonnet-4-20250514"

        # Load the strategy map
        if not os.path.exists(strategy_map_path):
            raise FileNotFoundError(f"Strategy map not found at {strategy_map_path}")

        with open(strategy_map_path, 'r', encoding='utf-8') as f:
            self.strategy_map = json.load(f)

    def generate_essay(self, target_scholarship_description, student_profile):
        """Main essay generation workflow."""
        # Step 1: Semantic Matching
        matching_clusters = self._find_matching_clusters(target_scholarship_description)

        # Step 2: Student Feasibility Filter
        valid_strategies = self._filter_by_student_capability(matching_clusters, student_profile)

        if not valid_strategies:
            # Use top match as fallback
            valid_strategies = matching_clusters[:1]

        # Step 3: Random Selection
        selected_strategy = random.choice(valid_strategies)

        # Step 4: Generate the Essay
        essay = self._generate_draft(
            target_scholarship_description,
            student_profile,
            selected_strategy
        )

        return {
            "essay": essay,
            "selected_strategy": selected_strategy,
            "matching_clusters": [c.get('cluster_name', f"Cluster {c['cluster_id']}")
                                  for c in matching_clusters]
        }

    def _find_matching_clusters(self, target_description):
        """Use Claude to identify which strategy clusters match the target scholarship."""
        archetypes_list = []
        for cluster in self.strategy_map:
            archetypes_list.append(f"""
Cluster ID: {cluster['cluster_id']}
Name: {cluster.get('cluster_name', 'N/A')}
Description Archetype: {cluster['description_archetype']}
""")

        matching_prompt = f"""You are an expert at matching scholarship descriptions to writing strategies.

TARGET SCHOLARSHIP DESCRIPTION:
{target_description}

AVAILABLE STRATEGY CLUSTERS:
{"".join(archetypes_list)}

TASK:
Identify which clusters are semantically similar to the target scholarship. A scholarship may match multiple clusters (e.g., it could be both "Academic Research" and "Leadership").

Rank the matches from most relevant to least relevant. Return ONLY a JSON array of cluster IDs in order of relevance:

Example output: [3, 1, 5]

Only include clusters that have meaningful overlap with the target scholarship. Return at minimum 1 and at maximum 4 cluster IDs.

Respond with ONLY the JSON array, no additional text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            temperature=0.2,
            messages=[{"role": "user", "content": matching_prompt}]
        )

        response_text = response.content[0].text.strip()
        cluster_ids = json.loads(response_text)

        return [c for c in self.strategy_map if c['cluster_id'] in cluster_ids]

    def _filter_by_student_capability(self, clusters, student_profile):
        """Filter strategies to only those the student can realistically execute."""
        student_profile_text = json.dumps(student_profile, indent=2)

        filter_prompt = f"""You are evaluating whether a student can execute certain essay writing strategies.

STUDENT PROFILE:
{student_profile_text}

STRATEGIES TO EVALUATE:
"""

        for cluster in clusters:
            filter_prompt += f"""
---
Strategy {cluster['cluster_id']}: {cluster.get('cluster_name', 'N/A')}
Requirements: {cluster['writing_strategy']['broad_instructions'][:300]}...
"""

        filter_prompt += """

TASK:
For each strategy, determine if the student has the background/experiences needed to execute it authentically and effectively.

FILTERING RULES:
- If a strategy requires "overcoming adversity/hardship" but the student has no hardships listed → REJECT
- If a strategy requires "research experience" but the student has none → REJECT
- If a strategy requires "leadership roles" but the student has minimal leadership → REJECT
- If a strategy requires "technical/STEM accomplishments" but the student is humanities-focused → REJECT
- If the student HAS relevant experiences for the strategy → ACCEPT

Return ONLY a JSON array of cluster IDs that the student CAN execute:

Example: [1, 3]

If the student can't execute ANY of the strategies well, return an empty array: []

Respond with ONLY the JSON array, no additional text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            temperature=0.2,
            messages=[{"role": "user", "content": filter_prompt}]
        )

        response_text = response.content[0].text.strip()
        valid_cluster_ids = json.loads(response_text)

        return [c for c in clusters if c['cluster_id'] in valid_cluster_ids]

    def _generate_draft(self, scholarship_description, student_profile, strategy):
        """Generate the actual essay using Claude."""
        student_profile_text = json.dumps(student_profile, indent=2)

        generation_prompt = f"""You are a skilled scholarship essay writer. Your task is to write a compelling essay for the following scholarship.

SCHOLARSHIP DESCRIPTION:
{scholarship_description}

STUDENT PROFILE:
{student_profile_text}

WRITING STRATEGY TO FOLLOW:
{strategy['writing_strategy']['broad_instructions']}

STRUCTURAL TEMPLATE (YOU MUST FOLLOW THIS STRUCTURE):
{strategy['writing_strategy']['structural_template']}

REQUIREMENTS:
1. Write in the first person from the student's perspective
2. Strictly follow the structural template provided
3. Make it authentic and personal, drawing from the student's actual experiences
4. Keep the tone professional yet engaging
5. Aim for 500-650 words
6. Include specific, vivid details that bring the story to life
7. End with a forward-looking conclusion that connects to the scholarship's goals

Write the complete essay now. Do not include a title or any preamble—just the essay text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.7,
            messages=[{"role": "user", "content": generation_prompt}]
        )

        return response.content[0].text.strip()


def generate_essay(scholarship_description, student_profile_dict, scholarship_name="Scholarship"):
    """Main function to generate essay given scholarship description and student profile."""
    try:
        generator = EssayGenerator()
        
        result = generator.generate_essay(scholarship_description, student_profile_dict)
        
        # Add scholarship name to result
        result["scholarship_name"] = scholarship_name
        
        return result
        
    except Exception as e:
        print(f"Error in generate_essay: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


if __name__ == "__main__":
    # Read JSON input from stdin
    input_data = json.loads(sys.stdin.read())
    scholarship_desc = input_data.get("scholarshipDescription", "")
    student_profile = input_data.get("studentProfile", {})
    scholarship_name = input_data.get("scholarshipName", "Scholarship")
    
    # Process
    result = generate_essay(scholarship_desc, student_profile, scholarship_name)
    
    # Output JSON to stdout
    print(json.dumps(result))
