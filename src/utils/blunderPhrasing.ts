export interface BlunderContext {
  manager: string;
  teamName: string;
  position: string;
  benchPlayerName: string;
  benchPlayerPoints: number;
  starterPlayerName: string;
  starterPlayerPoints: number;
  pointsDifference: number;
  matchupMargin: number;
  opponentName: string;
  wouldHaveWon: boolean;
  didLose: boolean;
  index: number;
}

export interface GeneratedBlunderText {
  primaryBlurb: string;
  headline: string;
  flavorTag: string;
  alternativeBlurbs: string[];
}

export function generateBlunderPhrasing(ctx: BlunderContext): GeneratedBlunderText {
  const {
    manager,
    teamName,
    position,
    benchPlayerName: bench,
    benchPlayerPoints: benchPts,
    starterPlayerName: starter,
    starterPlayerPoints: starterPts,
    pointsDifference: diff,
    matchupMargin: margin,
    opponentName: opp,
    wouldHaveWon,
    didLose,
    index,
  } = ctx;

  const closedGap = Number(Math.max(0, margin - diff).toFixed(2));
  const flippedMargin = Number((diff - margin).toFixed(2));

  let headlines: string[] = [];
  let tags: string[] = [];
  let options: string[] = [];

  if (wouldHaveWon) {
    // Scenario 1: Game-Flipping Heartbreak
    headlines = [
      'The Game-Flipping Heartbreak',
      'The Agonizing What-If',
      'The Fatal Lineup Swap',
      'Victory Left on the Pine',
      'Unforced Coaching Catastrophe',
    ];

    tags = [
      'MATCHUP FLIPPER',
      'FATAL BENCH ERROR',
      'VICTORY THROWN AWAY',
      'LINEUP HEARTBREAK',
      'COACHING COLLAPSE',
    ];

    options = [
      `If only ${manager} had trusted ${bench} (${benchPts} pts) over ${starter} (${starterPts} pts), that ${margin}-point loss to ${opp} flips into an emphatic ${flippedMargin > 0 ? `+${flippedMargin} pt ` : ''}victory.`,
      `${manager} will be staring at the ceiling tonight: benching ${bench} (${benchPts} pts) in favor of ${starter} (${starterPts} pts) was the sole difference between an agonizing defeat and triumph over ${opp}.`,
      `A catastrophic coaching self-destruct. ${opp} didn't beat ${manager}—${manager}'s own lineup card did. Swapping in ${bench}'s ${benchPts} points would have overcome the ${margin}-point deficit outright.`,
      `Leaving pure gold stranded on the pine: with a +${diff} point positional swing from ${bench}, ${manager} had the exact blueprint to conquer ${opp} sitting completely untouched.`,
      `The math is going to haunt ${manager} all week: ${bench} outscored ${starter} by ${diff} points, turning what should have been a signature win against ${opp} into an excruciating ${margin}-point loss.`,
      `A brutal case of overthinking the matchup: ${manager} parked ${bench} (${benchPts} pts) behind a sputtering ${starter} (${starterPts} pts), gifting ${opp} a win they never should have had.`,
    ];
  } else if (didLose) {
    // Scenario 2: Deficit Trimmed / Damage Control Left on the Bench
    headlines = [
      'Salt in the Wound',
      'Damage Control Left on the Pine',
      'The Pine Eruption',
      `Wrong Horse at ${position}`,
      'Searching for Answers',
      'A Bitter Pill on the Bench',
    ];

    tags = [
      'SALT IN THE WOUND',
      diff >= 15 ? 'BENCH NUKE' : 'MISSED FIREPOWER',
      'LINEUP REGRET',
      'WRONG CALL',
      'UNLEASHED TOO LATE',
    ];

    options = [
      `It wouldn't have rewritten history against ${opp}, but starting ${bench} (${benchPts} pts) instead of ${starter} (${starterPts} pts) would have trimmed that ${margin}-point beatdown to a far more respectable ${closedGap} points.`,
      `${manager} watched helplessly as ${bench} erupted for ${benchPts} points from the pine while ${starter} sputtered to just ${starterPts}. No miracle against ${opp}, but letting ${diff} points rot on the shelf stings.`,
      `Cold comfort for ${teamName}: ${bench} proved they deserved the start with ${benchPts} points over ${starter}'s meager ${starterPts}. At least ${manager} would have made ${opp} sweat until the fourth quarter.`,
      `Adding insult to injury against ${opp}, ${manager} picked the wrong horse at ${position}. Letting ${diff} extra points sit idle on the bench is pure salt in an already painful loss.`,
      `The brightest spark on ${teamName}'s roster never even touched the gridiron. ${bench} posted ${benchPts} points, while starter ${starter} dragged the squad down with ${starterPts} against ${opp}.`,
      `If only ${manager} had started ${bench} who scored ${benchPts} points instead of ${starter}, then maybe his team could be competitive (closing the gap to ${closedGap} pts against ${opp}).`,
    ];
  } else {
    // Scenario 3: Won Anyway - Luxury Blunder / Surviving the Malpractice
    headlines = [
      'Luxury Malpractice',
      'Won in Spite of Themselves',
      'Leaving Meat on the Bone',
      'The Untapped Blowout',
      'Surviving the Bench Explosion',
    ];

    tags = [
      'LUXURY BLUNDER',
      'SURVIVED THE GOOF',
      diff >= 15 ? 'BENCH NUKE' : 'POINTS STRANDED',
      'DODGED A BULLET',
      'UNPUNISHED HUBRIS',
    ];

    options = [
      `A victory in the books, but ${manager} left serious meat on the bone: ${bench}'s ${benchPts} points went completely uncashed while ${starter} posted just ${starterPts}.`,
      `${manager} survived their own coaching misstep against ${opp}. Benching ${bench} (+${diff} pts over ${starter}) is the kind of gamble that usually angers the fantasy gods, but they escaped unscathed.`,
      `Had ${manager} pulled the trigger on ${bench} (${benchPts} pts) over ${starter} (${starterPts} pts), they would have shattered the league scoring ceiling and turned a routine win into a historic beatdown.`,
      `${opp} let them off the hook, but ${manager} rolling out ${starter} (${starterPts} pts) while a scorching ${bench} posted ${benchPts} will definitely be discussed in film study.`,
      `Fortune smiled on ${manager} this week: despite benching ${diff} points with ${bench} riding the pine, their squad still had enough horsepower to leave ${opp} in the dust.`,
    ];
  }

  // Use index to deterministically rotate across variety so adjacent blunders never sound alike
  const selectedIndex = index % options.length;
  const primaryBlurb = options[selectedIndex];
  const headline = headlines[index % headlines.length];
  const flavorTag = tags[index % tags.length];
  const alternativeBlurbs = options.filter((o) => o !== primaryBlurb);

  return {
    primaryBlurb,
    headline,
    flavorTag,
    alternativeBlurbs,
  };
}
