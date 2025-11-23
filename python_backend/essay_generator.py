import sys
import json
import os
import random
from anthropic import Anthropic

# Hardcode the API key here
CLAUDE_API_KEY = "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"

# Force the SDK to read the key from both environment and constructor
os.environ["ANTHROPIC_API_KEY"] = CLAUDE_API_KEY


class EssayGenerator:
    """Generates scholarship essays using the strategy map and student profiles."""

    def __init__(self, strategy_map_path="python_backend/strategy_map.json"):
        # Ensure the SDK uses the hardcoded key
        self.client = Anthropic(api_key=CLAUDE_API_KEY)
        self.model = "claude-sonnet-4-20250514"

        # Load the strategy map
        if not os.path.exists(strategy_map_path):
            raise FileNotFoundError(f"Strategy map not found at {strategy_map_path}")

        with open(strategy_map_path, 'r', encoding='utf-8') as f:
            self.strategy_map = json.load(f)

    def generate_essay(self, target_scholarship_description, student_profile):
        matching_clusters = self._find_matching_clusters(target_scholarship_description)
        valid_strategies = self._filter_by_student_capability(matching_clusters, student_profile)

        if not valid_strategies:
            valid_strategies = matching_clusters[:1]

        selected_strategy = random.choice(valid_strategies)

        essay = self._generate_draft(target_scholarship_description, student_profile, selected_strategy)

        return {
            "essay": essay,
            "selected_strategy": selected_strategy,
            "matching_clusters": [c.get('cluster_name', f"Cluster {c['cluster_id']}") for c in matching_clusters]
        }

    def _find_matching_clusters(self, target_description):
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
Identify which clusters are semantically similar to the target scholarship. Return ONLY a JSON array of cluster IDs."""

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
        student_profile_text = json.dumps(student_profile, indent=2)
        filter_prompt = f"STUDENT PROFILE:\n{student_profile_text}\nSTRATEGIES TO EVALUATE:\n"
        for cluster in clusters:
            filter_prompt += f"\n---\nStrategy {cluster['cluster_id']}: {cluster.get('cluster_name', 'N/A')}\nRequirements: {cluster['writing_strategy']['broad_instructions'][:300]}...\n"
        filter_prompt += "\nTASK: Determine if the student can execute these strategies. Return ONLY a JSON array of acceptable cluster IDs."

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
        student_profile_text = json.dumps(student_profile, indent=2)
        generation_prompt = f"""Write a scholarship essay for the following scholarship:

SCHOLARSHIP DESCRIPTION:
{scholarship_description}

STUDENT PROFILE:
{student_profile_text}

WRITING STRATEGY:
{strategy['writing_strategy']['broad_instructions']}

STRUCTURAL TEMPLATE:
{strategy['writing_strategy']['structural_template']}

Follow these rules:
1. First-person perspective
2. Strictly follow the template
3. Authentic, personal
4. 500-650 words
5. Professional and engaging

Write only the essay text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.7,
            messages=[{"role": "user", "content": generation_prompt}]
        )
        return response.content[0].text.strip()


def generate_essay(scholarship_description, student_profile_dict, scholarship_name="Scholarship"):
    try:
        generator = EssayGenerator()
        result = generator.generate_essay(scholarship_description, student_profile_dict)
        result["scholarship_name"] = scholarship_name
        return result
    except Exception as e:
        print(f"Error in generate_essay: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    scholarship_desc = input_data.get("scholarshipDescription", "")
    student_profile = input_data.get("studentProfile", {})
    scholarship_name = input_data.get("scholarshipName", "Scholarship")
    result = generate_essay(scholarship_desc, student_profile, scholarship_name)
    print(json.dumps(result))
