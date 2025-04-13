import { Player, Team, TeamStats, Position } from '@/data/types';

/**
 * Divides players into balanced soccer teams
 * @param players List of players to divide
 * @param numTeams Number of teams (2 or 4)
 * @returns Array of teams
 */
export function divideTeams(players: Player[], numTeams: 2 | 4, randomSeed = Math.random()): Team[] {
  if (numTeams !== 2 && numTeams !== 4) {
    throw new Error('Number of teams must be either 2 or 4');
  }

  if (players.length < numTeams) {
    throw new Error(`Cannot create ${numTeams} teams with only ${players.length} players`);
  }

  // Initialize teams with empty players array and 0 elo
  const teams: Team[] = Array.from({ length: numTeams }, () => ({ players: [], elo: 0 }));

  // Sort players by rating (highest to lowest)
  // Add a small random factor (up to 0.5 rating points) to avoid identical distributions
  const sortedPlayers = [...players].sort((a, b) => {
    const randomFactorA = (Math.random() * randomSeed) % 0.5;
    const randomFactorB = (Math.random() * randomSeed) % 0.5;
    return (b.rating + randomFactorB) - (a.rating + randomFactorA);
  });

  // Calculate players per team for even distribution
  const basePlayersPerTeam = Math.floor(players.length / numTeams);
  const extraPlayers = players.length % numTeams;
  
  // For even distribution, we'll set aside the bottom-rated players
  // if we can't evenly distribute them
  let playersToDistribute = [...sortedPlayers];
  let extraPlayersList: Player[] = [];
  
  if (extraPlayers > 0) {
    // Take the lowest-rated players out of the initial distribution
    extraPlayersList = playersToDistribute.splice(playersToDistribute.length - extraPlayers, extraPlayers);
  }

  // Step 1: Perform simple snake draft based on ratings with equal team sizes
  snakeDraft(playersToDistribute, teams);

  // Step 2: Balance positions if needed
  balancePositions(teams);
  
  // Step 3: Add the extra players to teams with lowest ELO
  if (extraPlayersList.length > 0) {
    distributeExtraPlayers(extraPlayersList, teams);
  }

  // Calculate final ELO for each team
  teams.forEach(team => {
    team.elo = team.players.reduce((sum, player) => sum + player.rating, 0);
    
    // Sort players by position
    team.players.sort((a, b) => {
      const posA = getPrimaryPosition(a);
      const posB = getPrimaryPosition(b);
      // Order: Defender, Midfielder, Attacker
      const posOrder: Record<Position, number> = {
        'Defender': 1,
        'Midfielder': 2,
        'Attacker': 3
      };
      return posOrder[posA] - posOrder[posB];
    });
  });

  return teams;
}

/**
 * Performs a snake draft to distribute players across teams
 */
function snakeDraft(players: Player[], teams: Team[]): void {
  let direction = 1; // 1 for forward, -1 for backward
  let teamIndex = 0;

  // Distribute players using snake draft
  while (players.length > 0) {
    // Add player to current team
    teams[teamIndex].players.push(players.shift()!);
    
    // Move to next team using snake pattern
    teamIndex += direction;
    
    // Reverse direction at the ends
    if (teamIndex === teams.length) {
      teamIndex = teams.length - 1;
      direction = -1;
    } else if (teamIndex < 0) {
      teamIndex = 0;
      direction = 1;
    }
  }
}

/**
 * Distributes extra players to teams with the lowest ELO
 */
function distributeExtraPlayers(extraPlayers: Player[], teams: Team[]): void {
  // Calculate current ELO for each team
  const teamElos = teams.map(team => 
    team.players.reduce((sum, player) => sum + player.rating, 0)
  );
  
  // Create team indices sorted by ELO (lowest first)
  const teamIndicesByElo = Array.from(
    { length: teams.length }, 
    (_, i) => i
  ).sort((a, b) => teamElos[a] - teamElos[b]);
  
  // Distribute extra players to teams with lowest ELO
  for (let i = 0; i < extraPlayers.length; i++) {
    const teamIndex = teamIndicesByElo[i % teamIndicesByElo.length];
    teams[teamIndex].players.push(extraPlayers[i]);
    
    // Update the ELO for this team
    teamElos[teamIndex] += extraPlayers[i].rating;
    
    // Re-sort team indices if we need to loop around
    if ((i + 1) % teamIndicesByElo.length === 0 && i + 1 < extraPlayers.length) {
      teamIndicesByElo.sort((a, b) => teamElos[a] - teamElos[b]);
    }
  }
}

/**
 * Balances positions across teams through player swaps
 */
function balancePositions(teams: Team[]): void {
  const MAX_SWAPS = 20; // Increased limit for more balancing opportunities
  
  // Get initial position balance across teams
  const initialStats = teams.map(calculateTeamStats);
  
  // First pass: Balance ELO ratings across teams
  balanceTeamElos(teams);
  
  // Second pass: Balance positions while maintaining ELO balance
  for (let swapAttempt = 0; swapAttempt < MAX_SWAPS; swapAttempt++) {
    let bestSwap: {
      teamAIndex: number,
      teamBIndex: number,
      playerAIndex: number,
      playerBIndex: number,
      improvement: number
    } | null = null;
    
    // Try swaps between each pair of teams
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const possibleSwap = findBestPositionSwap(teams[i], teams[j], i, j);
        
        if (possibleSwap && (!bestSwap || possibleSwap.improvement > bestSwap.improvement)) {
          bestSwap = possibleSwap;
        }
      }
    }
    
    // If no good swap was found, we're done
    if (!bestSwap || bestSwap.improvement <= 0) {
      break;
    }
    
    // Execute the best swap
    const { teamAIndex, teamBIndex, playerAIndex, playerBIndex } = bestSwap;
    const playerA = teams[teamAIndex].players[playerAIndex];
    const playerB = teams[teamBIndex].players[playerBIndex];
    
    teams[teamAIndex].players[playerAIndex] = playerB;
    teams[teamBIndex].players[playerBIndex] = playerA;
  }
}

/**
 * Balances ELO ratings across teams without changing team sizes
 */
function balanceTeamElos(teams: Team[]): void {
  const MAX_ELO_ITERATIONS = 10;
  
  for (let iteration = 0; iteration < MAX_ELO_ITERATIONS; iteration++) {
    let improved = false;
    
    // Calculate current team ELOs
    const teamElos = teams.map(team => 
      team.players.reduce((sum, player) => sum + player.rating, 0)
    );
    
    // Calculate average team ELO
    const avgElo = teamElos.reduce((sum, elo) => sum + elo, 0) / teams.length;
    
    // Calculate current ELO imbalance
    const initialImbalance = calculateEloImbalance(teamElos);
    
    // Try swaps between all pairs of teams
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        // Only attempt to balance if there's a significant difference
        if (Math.abs(teamElos[i] - teamElos[j]) < 0.5) continue;
        
        // Find the best ELO-balancing swap
        const bestSwap = findBestEloSwap(teams[i], teams[j], teamElos[i], teamElos[j], avgElo);
        
        if (bestSwap) {
          // Execute the swap
          const playerA = teams[i].players[bestSwap.playerAIndex];
          const playerB = teams[j].players[bestSwap.playerBIndex];
          
          teams[i].players[bestSwap.playerAIndex] = playerB;
          teams[j].players[bestSwap.playerBIndex] = playerA;
          
          // Update ELOs
          teamElos[i] = teamElos[i] - playerA.rating + playerB.rating;
          teamElos[j] = teamElos[j] - playerB.rating + playerA.rating;
          
          // Check if we improved overall balance
          const newImbalance = calculateEloImbalance(teamElos);
          if (newImbalance < initialImbalance) {
            improved = true;
          }
        }
      }
    }
    
    // Stop if no improvements were made
    if (!improved) break;
  }
}

/**
 * Calculates total ELO imbalance across all teams
 */
function calculateEloImbalance(teamElos: number[]): number {
  if (teamElos.length <= 1) return 0;
  
  const avgElo = teamElos.reduce((sum, elo) => sum + elo, 0) / teamElos.length;
  return teamElos.reduce((sum, elo) => sum + Math.abs(elo - avgElo), 0);
}

/**
 * Finds the best ELO-balancing swap between two teams
 */
function findBestEloSwap(
  teamA: Team, 
  teamB: Team, 
  eloA: number, 
  eloB: number, 
  targetElo: number
): { playerAIndex: number, playerBIndex: number } | null {
  let bestImprovement = -1;
  let bestSwap = null;
  
  for (let i = 0; i < teamA.players.length; i++) {
    for (let j = 0; j < teamB.players.length; j++) {
      const playerA = teamA.players[i];
      const playerB = teamB.players[j];
      
      // Calculate new ELOs after potential swap
      const newEloA = eloA - playerA.rating + playerB.rating;
      const newEloB = eloB - playerB.rating + playerA.rating;
      
      // Calculate current deviation from target
      const currentDeviation = Math.abs(eloA - targetElo) + Math.abs(eloB - targetElo);
      
      // Calculate new deviation from target
      const newDeviation = Math.abs(newEloA - targetElo) + Math.abs(newEloB - targetElo);
      
      // Calculate improvement
      const improvement = currentDeviation - newDeviation;
      
      // Check if this is better than our current best
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestSwap = { playerAIndex: i, playerBIndex: j };
      }
    }
  }
  
  return bestImprovement > 0 ? bestSwap : null;
}

/**
 * Finds the best position-improving swap between two teams
 */
function findBestPositionSwap(teamA: Team, teamB: Team, teamAIndex: number, teamBIndex: number): {
  teamAIndex: number,
  teamBIndex: number,
  playerAIndex: number,
  playerBIndex: number,
  improvement: number
} | null {
  const statsA = calculateTeamStats(teamA);
  const statsB = calculateTeamStats(teamB);
  
  // Calculate current position imbalance
  const currentImbalance = calculatePositionImbalance(statsA.positionCounts, statsB.positionCounts);
  
  let bestSwap: {
    playerAIndex: number,
    playerBIndex: number,
    improvement: number
  } | null = null;
  
  // Try swapping each pair of players
  for (let i = 0; i < teamA.players.length; i++) {
    for (let j = 0; j < teamB.players.length; j++) {
      // Skip if players have the same primary position
      const playerA = teamA.players[i];
      const playerB = teamB.players[j];
      
      const posA = getPrimaryPosition(playerA);
      const posB = getPrimaryPosition(playerB);
      
      if (posA === posB) continue;
      
      // Simulate swap
      teamA.players[i] = playerB;
      teamB.players[j] = playerA;
      
      // Calculate new stats
      const newStatsA = calculateTeamStats(teamA);
      const newStatsB = calculateTeamStats(teamB);
      const newImbalance = calculatePositionImbalance(newStatsA.positionCounts, newStatsB.positionCounts);
      
      // Calculate improvement (lower imbalance is better)
      const improvement = currentImbalance - newImbalance;
      
      // Check if ELOs remain reasonably balanced after swap
      const eloA = teamA.players.reduce((sum, p) => sum + p.rating, 0);
      const eloB = teamB.players.reduce((sum, p) => sum + p.rating, 0);
      const eloDifference = Math.abs(eloA - eloB);
      
      // Only consider swaps that maintain ELO balance (less than 1.5 point difference)
      // and improve position balance
      if (improvement > 0 && eloDifference < 1.5) {
        if (!bestSwap || improvement > bestSwap.improvement) {
          bestSwap = { playerAIndex: i, playerBIndex: j, improvement };
        }
      }
      
      // Revert swap
      teamA.players[i] = playerA;
      teamB.players[j] = playerB;
    }
  }
  
  if (!bestSwap) return null;
  
  return {
    teamAIndex,
    teamBIndex,
    playerAIndex: bestSwap.playerAIndex,
    playerBIndex: bestSwap.playerBIndex,
    improvement: bestSwap.improvement
  };
}

/**
 * Gets primary position of a player
 */
function getPrimaryPosition(player: Player): Position {
  if (player && player.position && Array.isArray(player.position) && player.position.length > 0) {
    return player.position[0];
  }
  return 'Midfielder'; // Default position
}

/**
 * Calculates team statistics
 */
function calculateTeamStats(team: Team): TeamStats {
  return {
    averageRating: calculateAverageRating(team.players),
    positionCounts: getPositionCounts(team.players),
    stdDev: calculateRatingStdDev(team.players)
  };
}

/**
 * Counts the number of players preferring each position
 */
function getPositionCounts(players: Player[]): Record<Position, number> {
  const counts: Record<Position, number> = {
    Attacker: 0,
    Midfielder: 0,
    Defender: 0
  };
  
  players.forEach(player => {
    counts[getPrimaryPosition(player)]++;
  });
  
  return counts;
}

/**
 * Calculates the average rating of a team
 */
function calculateAverageRating(players: Player[]): number {
  if (players.length === 0) return 0;
  const sum = players.reduce((total, player) => total + player.rating, 0);
  return sum / players.length;
}

/**
 * Calculates the standard deviation of player ratings in a team
 */
function calculateRatingStdDev(players: Player[]): number {
  if (players.length <= 1) return 0;
  
  const avg = calculateAverageRating(players);
  const squaredDiffs = players.map(player => Math.pow(player.rating - avg, 2));
  const sum = squaredDiffs.reduce((total, diff) => total + diff, 0);
  return Math.sqrt(sum / players.length);
}

/**
 * Calculates the position imbalance between two teams
 */
function calculatePositionImbalance(
  countsA: Record<Position, number>,
  countsB: Record<Position, number>
): number {
  return (
    Math.abs(countsA.Attacker - countsB.Attacker) +
    Math.abs(countsA.Midfielder - countsB.Midfielder) +
    Math.abs(countsA.Defender - countsB.Defender)
  );
}

/**
 * Utility function to evaluate team balance
 */
export function evaluateTeamBalance(teams: Team[]): {
  avgRatings: number[];
  stdDevs: number[];
  positionCounts: Record<Position, number>[];
  teamSizes: number[];
} {
  return {
    avgRatings: teams.map(team => calculateAverageRating(team.players)),
    stdDevs: teams.map(team => calculateRatingStdDev(team.players)),
    positionCounts: teams.map(team => getPositionCounts(team.players)),
    teamSizes: teams.map(team => team.players.length)
  };
}