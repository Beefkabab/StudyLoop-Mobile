import { Study, ParticipantProfile, MatchResult } from "../constants/types";

/**
 * Calculates a 10–99 match fit score between a clinical study protocol
 * and a participant profile, matching the server-side algorithm in studyloop-mvp.
 */
export function calculateMatchScore(study: Study, profile: ParticipantProfile): MatchResult {
  let score = 50;
  const matchReasons: string[] = [];
  const flags: string[] = [];

  // 1. Age Window Match
  if (profile.age >= study.minAge && profile.age <= study.maxAge) {
    score += 15;
    matchReasons.push(`Age ${profile.age} is within target window (${study.minAge}–${study.maxAge} yrs)`);
  } else {
    score -= 30;
    flags.push(`Age ${profile.age} outside preferred bracket (${study.minAge}–${study.maxAge} yrs)`);
  }

  // 2. Gender Recruitment Target
  if (study.targetGender === "all") {
    score += 10;
  } else if (study.targetGender === profile.gender) {
    score += 20;
    matchReasons.push(`Priority match: study actively recruiting ${study.targetGender} participants`);
  } else {
    score -= 25;
    flags.push(`Study specifically seeks ${study.targetGender} participants`);
  }

  // 3. Healthy Volunteer vs Condition Alignment
  if (profile.isHealthyVolunteer) {
    if (study.healthyVolunteersAccepted) {
      score += 15;
      matchReasons.push("Healthy volunteers are welcomed and eligible");
    } else {
      score -= 25;
      flags.push("Study requires specific diagnosed medical conditions");
    }
  } else {
    const profileConditions = profile.conditions || [];
    const requiredConditions = study.requiredConditions || [];
    const excludedConditions = study.excludedConditions || [];

    const hasRequired = requiredConditions.some((rc) =>
      profileConditions.some((pc) => pc.toLowerCase().includes(rc.toLowerCase()))
    );
    const hasExcluded = excludedConditions.some((ec) =>
      profileConditions.some((pc) => pc.toLowerCase().includes(ec.toLowerCase()))
    );

    if (hasRequired) {
      score += 25;
      matchReasons.push("Your diagnosed condition directly aligns with trial focus");
    } else if (requiredConditions.length > 0) {
      score -= 20;
      flags.push(`Protocol seeks participants with ${requiredConditions.join(", ")}`);
    }

    if (hasExcluded) {
      score -= 30;
      flags.push("Potential exclusion condition identified in profile");
    }
  }

  // 4. Location / Environment
  if (study.locationType === "remote") {
    score += 10;
    matchReasons.push("100% Remote - participate from home nationwide");
  } else {
    const cityMatch = profile.city.toLowerCase() === study.city.toLowerCase();
    const stateMatch = profile.state.toLowerCase() === study.state.toLowerCase();

    if (cityMatch || stateMatch) {
      score += 15;
      matchReasons.push(`Local site in ${study.city}, ${study.state}`);
    } else {
      score -= 10;
      flags.push(`Site is in ${study.city}, ${study.state} (Requires travel)`);
    }
  }

  // 5. Underrepresented Demographic Bonus (NIH diversity goals)
  const isRural = profile.livingEnvironment === "rural";
  const isHighSchoolOrLess = profile.educationLevel === "high_school_or_less";
  const isMaleTarget = study.targetGender === "all" && profile.gender === "male";

  if (study.targetDemographicFocus && (isRural || isHighSchoolOrLess || isMaleTarget)) {
    score += 15;
    matchReasons.push("High-priority match for study diversity & representation quotas");
  }

  // Bound score between 10% and 99%
  score = Math.max(10, Math.min(99, score));

  return {
    score,
    matchReasons,
    flags,
  };
}
