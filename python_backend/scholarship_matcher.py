import sys
import json
import requests
import chromadb
import anthropic
import os

# API Keys - these will be passed via environment or hardcoded
NOMIC_API_KEY = "nk-z8OzW3Ioqd0Dn5H7LVDJnKbjJyNbmQM6qAqk2V9E9yM"
CLAUDE_API_KEY = "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"

# Initialize Claude
claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

# Initialize ChromaDB - path relative to project root
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "attached_assets", "chroma_scholarship_db")

def embed_text_nomic(text):
    """Generates an embedding for a given text using Nomic Embed API."""
    if len(text) > 8000:
        text = text[:8000]

    try:
        url = "https://api-atlas.nomic.ai/v1/embedding/text"
        headers = {
            "Authorization": f"Bearer {NOMIC_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "texts": [text],
            "model": "nomic-embed-text-v1.5"
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()

        return data['embeddings'][0]

    except Exception as e:
        print(f"Error generating embedding: {e}", file=sys.stderr)
        return None


def extract_profile_structure(raw_profile):
    """Extract structured data from profile for eligibility filtering."""
    prompt = f"""Extract eligibility information from this student profile.

{raw_profile}

Return ONLY valid JSON with these fields:
{{
  "gpa": <float or null>,
  "degree_level": "high school" | "undergraduate" | "graduate" | "unknown",
  "field_of_study": "string or null",
  "citizenship": "string or null",
  "age": <integer or null>,
  "key_activities": ["activity1", "activity2", "activity3"]
}}

Be conservative - only extract what is explicitly stated. Use null if uncertain.
For key_activities, list their 3-5 most significant activities/involvements.
"""

    try:
        response = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        raw_text = response.content[0].text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        
        structured_data = json.loads(raw_text.strip())
        return structured_data

    except Exception as e:
        print(f"Failed to extract structure: {e}", file=sys.stderr)
        return {
            "gpa": None,
            "degree_level": "unknown",
            "field_of_study": None,
            "citizenship": None,
            "age": None,
            "key_activities": []
        }


def enhance_and_weight_profile(student_profile, structured_data):
    """Enhance profile AND apply true weighting by repeating key sections."""
    prompt = f"""Analyze this student profile and create an enhanced description optimized for scholarship matching.

CRITICAL RULES:
1. ONLY elaborate on details EXPLICITLY mentioned - do not invent anything
2. Focus heavily on activities, leadership, impact, and character
3. Academic metrics like GPA are less important than demonstrated experiences
4. Write in rich, specific language about their actual accomplishments

Student Profile:
{student_profile}

Create a comprehensive description emphasizing (in priority order):
1. **Leadership experiences and their impact** - What they led and what changed
2. **Community service and values** - How they contribute and what matters to them
3. **Unique projects, initiatives, or achievements** - What they've created
4. **Skills and competencies demonstrated** - What they can DO
5. **Passions and authentic interests** - What genuinely drives them
6. **Character traits and qualities** - What kind of person they are
7. Academic performance and field of study (mention briefly)

Write 2-3 paragraphs that showcase what makes them special. Stay truthful to the original profile.
"""

    try:
        response = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )
        
        enhanced = response.content[0].text.strip()
        
        # Apply TRUE weighting by repeating key activities
        weighted_profile = enhanced + "\n\n"
        
        if structured_data.get("key_activities"):
            activities_text = "Core strengths and activities: " + " | ".join(structured_data["key_activities"])
            weighted_profile += activities_text + "\n"
            weighted_profile += activities_text + "\n"  # Repeat for semantic weight
        
        return weighted_profile
        
    except Exception as e:
        print(f"Enhancement failed, using original: {e}", file=sys.stderr)
        return student_profile + "\n\n" + student_profile


def vector_search(enhanced_profile, structured_data, chroma_client, top_k=5, distance_threshold=1.0):
    """Find top matching scholarships with distance filtering AND metadata filtering."""
    try:
        scholarships_collection = chroma_client.get_collection("scholarships")
    except Exception as e:
        print(f"Error loading scholarships collection: {e}", file=sys.stderr)
        return []
    
    student_vector = embed_text_nomic(enhanced_profile)
    
    if student_vector is None:
        print("Failed to generate embedding", file=sys.stderr)
        return []
    
    collection_count = scholarships_collection.count()
    
    try:
        # Get more results initially to allow for filtering
        results = scholarships_collection.query(
            query_embeddings=[student_vector],
            n_results=min(top_k * 3, collection_count)
        )
        
        matches = []
        filtered_out = {"gpa": 0, "degree_level": 0, "distance": 0}
        
        if results["ids"] and len(results["ids"]) > 0:
            for i, scholarship_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i]
                metadata = results["metadatas"][0][i]
                full_text = results["documents"][0][i] if results["documents"] else ""
                
                # Filter by distance threshold
                if distance > distance_threshold:
                    filtered_out["distance"] += 1
                    continue
                
                # Filter by GPA if both student and scholarship have GPA data
                if structured_data.get("gpa") and metadata.get("minimum_gpa"):
                    try:
                        min_gpa = float(metadata["minimum_gpa"])
                        if structured_data["gpa"] < min_gpa:
                            filtered_out["gpa"] += 1
                            continue
                    except (ValueError, TypeError):
                        pass
                
                # Filter by degree level if specified
                student_level = structured_data.get("degree_level", "").lower()
                scholarship_levels = metadata.get("degree_levels", "").lower()
                
                if scholarship_levels and student_level != "unknown":
                    if scholarship_levels and student_level not in scholarship_levels:
                        if ("undergraduate" in scholarship_levels and student_level == "graduate") or \
                           ("graduate" in scholarship_levels and student_level == "high school"):
                            filtered_out["degree_level"] += 1
                            continue
                
                matches.append({
                    "scholarship": scholarship_id,
                    "distance": distance,
                    "url": metadata.get("url", "N/A"),
                    "full_text": full_text,
                    "metadata": metadata
                })
        
        # Sort by distance and take top k
        matches = sorted(matches, key=lambda x: x['distance'])[:top_k]
        
        return matches
        
    except Exception as e:
        print(f"Error in vector search: {e}", file=sys.stderr)
        return []


def llm_rerank(enhanced_profile, structured_data, matches, top_k=5):
    """Use Claude to intelligently re-rank scholarships with full context."""
    if not matches:
        return []
    
    # Format scholarships with FULL text AND metadata
    scholarship_details = []
    for i, match in enumerate(matches, 1):
        meta = match['metadata']
        scholarship_details.append({
            "id": i,
            "name": match['scholarship'],
            "distance": round(match['distance'], 4),
            "url": match['url'],
            "description": match['full_text'],
            "minimum_gpa": meta.get("minimum_gpa"),
            "degree_levels": meta.get("degree_levels"),
            "fields_of_study": meta.get("fields_of_study"),
            "emphasis_areas": meta.get("emphasis_areas"),
            "values_mission": meta.get("values_mission"),
            "award_amount": meta.get("award_amount")
        })
    
    prompt = f"""You are an expert scholarship advisor. Analyze how well each scholarship matches this student.

CRITICAL PRIORITIES (in order):
1. **Activity and emphasis alignment** - Do the student's activities match what the scholarship emphasizes?
2. **Values and mission fit** - Do the student's demonstrated values align with scholarship mission?
3. **Leadership and impact** - Does the student's impact match what the scholarship rewards?
4. **Eligibility match** - Degree level, field of study, citizenship
5. **Academic requirements** - GPA (least important unless scholarship is primarily academic)

STUDENT PROFILE:
{enhanced_profile}

STUDENT DATA:
- GPA: {structured_data.get('gpa', 'Not specified')}
- Degree Level: {structured_data.get('degree_level', 'Unknown')}
- Field of Study: {structured_data.get('field_of_study', 'Not specified')}
- Key Activities: {', '.join(structured_data.get('key_activities', []))}

SCHOLARSHIPS TO EVALUATE:
{json.dumps(scholarship_details, indent=2)}

Rank the top {top_k} scholarships from best to worst match.

Return ONLY valid JSON in this exact format:
{{
  "rankings": [
    {{
      "rank": 1,
      "scholarship_id": <id number from above>,
      "scholarship_name": "<exact name>",
      "match_score": <0-100>,
      "reasoning": "<2-3 sentences explaining fit, focusing on activity/emphasis alignment>",
      "key_strengths": ["strength1", "strength2"]
    }}
  ]
}}

IMPORTANT: Return ONLY the JSON, no additional text."""

    try:
        response = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        rankings_data = json.loads(response_text.strip())
        
        # Map rankings back to original matches
        ranked_matches = []
        for ranking in rankings_data.get("rankings", []):
            scholarship_id = ranking["scholarship_id"] - 1
            if 0 <= scholarship_id < len(matches):
                match = matches[scholarship_id].copy()
                match["rank"] = ranking["rank"]
                match["match_score"] = ranking["match_score"]
                match["reasoning"] = ranking["reasoning"]
                ranked_matches.append(match)
        
        return ranked_matches[:top_k]
        
    except Exception as e:
        print(f"Re-ranking failed, returning original matches: {e}", file=sys.stderr)
        # Return original matches with default scores
        for i, match in enumerate(matches[:top_k], 1):
            match["rank"] = i
            match["match_score"] = int((1 - match["distance"]) * 100)
        return matches[:top_k]


def match_scholarships(student_profile_dict):
    """Main function to match scholarships given a student profile."""
    try:
        # Initialize ChromaDB
        chroma_client = chromadb.PersistentClient(path=DB_PATH)
        
        # Build raw profile text
        raw_profile = f"""
Name: {student_profile_dict.get('name', 'N/A')}
GPA: {student_profile_dict.get('gpa', 'N/A')}
Degree Level: {student_profile_dict.get('degreeLevel', 'N/A')}
Field of Study: {student_profile_dict.get('fieldOfStudy', 'N/A')}
Citizenship: {student_profile_dict.get('citizenship', 'N/A')}
Age: {student_profile_dict.get('age', 'N/A')}

Activities & Involvement:
{student_profile_dict.get('activities', 'N/A')}

Background Story:
{student_profile_dict.get('backgroundStory', 'N/A')}

Career Goals:
{student_profile_dict.get('careerGoals', 'N/A')}

Challenges Overcome:
{student_profile_dict.get('challenges', 'N/A')}
"""
        
        # Extract structured data
        structured_data = extract_profile_structure(raw_profile)
        
        # Enhance and weight profile
        enhanced_profile = enhance_and_weight_profile(raw_profile, structured_data)
        
        # Vector search
        matches = vector_search(enhanced_profile, structured_data, chroma_client, top_k=15)
        
        if not matches:
            return {"matches": []}
        
        # LLM re-ranking
        ranked_matches = llm_rerank(enhanced_profile, structured_data, matches, top_k=5)
        
        return {"matches": ranked_matches}
        
    except Exception as e:
        print(f"Error in match_scholarships: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


if __name__ == "__main__":
    # Read JSON input from stdin
    input_data = json.loads(sys.stdin.read())
    student_profile = input_data.get("studentProfile", {})
    
    # Process
    result = match_scholarships(student_profile)
    
    # Output JSON to stdout
    print(json.dumps(result))
