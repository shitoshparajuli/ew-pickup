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

  // Sort players by rating with some randomization
  // Add a small random factor (up to 0.5 rating points) to create different distributions
  const sortedPlayers = [...players].sort((a, b) => {
    const randomFactorA = (Math.random() * randomSeed) % 0.5;
    const randomFactorB = (Math.random() * randomSeed) % 0.5;
    return (b.rating + randomFactorB) - (a.rating + randomFactorA);
  });

  // Initialize teams
  const teams: Team[] = Array.from({ length: numTeams }, () => ({ players: [] }));

  // Calculate players per team
  const playersPerTeam = Math.floor(players.length / numTeams);
  const extraPlayers = players.length % numTeams;

  // Set target sizes for each team
  const teamSizes: number[] = Array(numTeams).fill(playersPerTeam);
  for (let i = 0; i < extraPlayers; i++) {
    teamSizes[i]++;
  }

  // First, distribute players by position to ensure position balance
  distributePlayersByPosition(sortedPlayers, teams, teamSizes);
  
  // Optimize team composition
  optimizeTeams(teams, teamSizes);

  return teams;
}

/**
 * Distributes players to teams based on positions
 */
function distributePlayersByPosition(
  sortedPlayers: Player[],
  teams: Team[],
  teamSizes: number[]
): void {
  // Group players by their primary position preference
  const playersByPosition: Record<Position, Player[]> = {
    Attacker: [],
    Midfielder: [],
    Defender: []
  };
  
  // Players without position preference
  const unspecifiedPlayers: Player[] = [];
  
  // Categorize players
  sortedPlayers.forEach(player => {
    if (player.position && player.position.length > 0) {
      playersByPosition[player.position[0]].push(player);
    } else {
      unspecifiedPlayers.push(player);
    }
  });
  
  // Shuffle players within each position group to add randomness
  // but maintain the general skill ordering
  shufflePlayersWithinRatingGroups(playersByPosition.Attacker);
  shufflePlayersWithinRatingGroups(playersByPosition.Midfielder);
  shufflePlayersWithinRatingGroups(playersByPosition.Defender);
  shufflePlayersWithinRatingGroups(unspecifiedPlayers);
  
  // Calculate how many players of each position we need per team
  const positionDistribution: Record<Position, number[]> = {
    Attacker: Array(teams.length).fill(0),
    Midfielder: Array(teams.length).fill(0),
    Defender: Array(teams.length).fill(0)
  };
  
  // Calculate ideal distribution of positions
  const positions: Position[] = ['Attacker', 'Midfielder', 'Defender'];
  positions.forEach(pos => {
    const totalPlayers = playersByPosition[pos].length;
    const playersPerTeam = Math.floor(totalPlayers / teams.length);
    const extra = totalPlayers % teams.length;
    
    for (let i = 0; i < teams.length; i++) {
      positionDistribution[pos][i] = playersPerTeam + (i < extra ? 1 : 0);
    }
  });
  
  // Distribute players by position using snake draft within each position
  positions.forEach(pos => {
    let direction = 1;
    let teamIndex = 0;
    
    while (playersByPosition[pos].length > 0) {
      // Find next team that needs this position
      let teamsChecked = 0;
      let foundTeam = false;
      
      while (teamsChecked < teams.length) {
        if (
          getPositionCount(teams[teamIndex].players, pos) < positionDistribution[pos][teamIndex] && 
          teams[teamIndex].players.length < teamSizes[teamIndex]
        ) {
          foundTeam = true;
          break;
        }
        
        teamIndex = (teamIndex + direction + teams.length) % teams.length;
        teamsChecked++;
        
        // Reverse direction at the ends
        if (teamIndex === 0 || teamIndex === teams.length - 1) {
          direction *= -1;
        }
      }
      
      // If we've checked all teams and found none that need this position, break
      if (!foundTeam) break;
      
      // Add player to team
      teams[teamIndex].players.push(playersByPosition[pos].shift()!);
      
      // Move to next team
      teamIndex = (teamIndex + direction + teams.length) % teams.length;
      
      // Reverse direction at the ends
      if (teamIndex === 0 || teamIndex === teams.length - 1) {
        direction *= -1;
      }
    }
  });
  
  // Distribute remaining position-specific players
  const remainingPositionPlayers: Player[] = [
    ...playersByPosition.Attacker, 
    ...playersByPosition.Midfielder, 
    ...playersByPosition.Defender
  ].sort((a, b) => b.rating - a.rating);
  
  distributeRemainingPlayers(remainingPositionPlayers, teams, teamSizes);
  
  // Finally, distribute players without position preferences
  distributeRemainingPlayers(unspecifiedPlayers, teams, teamSizes);
}

/**
 * Shuffles an array in-place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Shuffles players within similar rating groups
 * This maintains general skill ordering while adding randomness
 */
function shufflePlayersWithinRatingGroups(players: Player[]): void {
  if (players.length <= 3) {
    shuffleArray(players);
    return;
  }
  
  // Sort by rating first
  players.sort((a, b) => b.rating - a.rating);
  
  // Divide players into groups (top third, middle third, bottom third)
  const groupSize = Math.ceil(players.length / 3);
  
  // Shuffle within each group
  for (let i = 0; i < 3; i++) {
    const start = i * groupSize;
    const end = Math.min(start + groupSize, players.length);
    
    if (start >= end) continue;
    
    // Get the group
    const group = players.slice(start, end);
    shuffleArray(group);
    
    // Put it back
    for (let j = 0; j < group.length; j++) {
      players[start + j] = group[j];
    }
  }
}

/**
 * Gets the count of players with a specific primary position preference
 */
function getPositionCount(players: Player[], position: Position): number {
  return players.filter(player => 
    player.position && player.position.length > 0 && player.position[0] === position
  ).length;
}

/**
 * Distributes remaining players to balance team sizes
 */
function distributeRemainingPlayers(
  players: Player[],
  teams: Team[],
  teamSizes: number[]
): void {
  // Shuffle the order of players slightly to introduce randomness
  for (let i = players.length - 1; i > 0; i--) {
    // Use Fisher-Yates shuffle algorithm with constraints to maintain some skill ordering
    // Only swap with nearby players (within 25% of the array) to maintain rough skill groupings
    const range = Math.max(3, Math.floor(i * 0.25));
    const j = Math.floor(Math.random() * range) + Math.max(0, i - range);
    [players[i], players[j]] = [players[j], players[i]];
  }
  
  // Use snake draft pattern for remaining players
  let direction = 1;
  let teamIndex = 0;
  
  while (players.length > 0) {
    // Find next team that needs players
    let teamsChecked = 0;
    let foundTeam = false;
    
    while (teamsChecked < teams.length) {
      if (teams[teamIndex].players.length < teamSizes[teamIndex]) {
        foundTeam = true;
        break;
      }
      
      teamIndex = (teamIndex + direction + teams.length) % teams.length;
      teamsChecked++;
      
      // Reverse direction at the ends
      if (teamIndex === 0 || teamIndex === teams.length - 1) {
        direction *= -1;
      }
    }
    
    // If we've checked all teams and found none that need players, break
    if (!foundTeam) break;
    
    // Find best player for this team
    const teamStats = calculateTeamStats(teams[teamIndex]);
    let bestPlayerIndex = 0;
    let bestScore = -1;
    
    for (let i = 0; i < players.length; i++) {
      const score = calculatePlayerFitScore(players[i], teams[teamIndex], teamStats);
      if (score > bestScore) {
        bestScore = score;
        bestPlayerIndex = i;
      }
    }
    
    teams[teamIndex].players.push(players.splice(bestPlayerIndex, 1)[0]);
    
    // Move to next team
    teamIndex = (teamIndex + direction + teams.length) % teams.length;
    
    // Reverse direction at the ends
    if (teamIndex === 0 || teamIndex === teams.length - 1) {
      direction *= -1;
    }
  }
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
    if (player.position && player.position.length > 0) {
      counts[player.position[0]]++;
    }
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
 * Calculates a score representing how much a player fits a team's needs
 */
function calculatePlayerFitScore(player: Player, team: Team, teamStats: TeamStats): number {
  // Position need score
  let positionScore = 0;
  
  if (player.position && player.position.length > 0) {
    positionScore = player.position.reduce((score, pos, index) => {
      // Calculate how much this position is needed in the team (lower count is higher need)
      const positionCount = teamStats.positionCounts[pos];
      const maxPositionCount = Math.max(...Object.values(teamStats.positionCounts));
      const positionNeedFactor = maxPositionCount > 0 ? 1 - (positionCount / maxPositionCount) : 0;
      
      // Higher score for primary position, lower for secondary, etc.
      const preferenceMultiplier = 1 - (index * 0.3);
      
      return score + (positionNeedFactor * preferenceMultiplier * 10);
    }, 0);
  }
  
  // Rating balance score (higher if player's rating helps balance team rating)
  const avgTeamRating = teamStats.averageRating;
  const ratingBalanceScore = 10 - Math.abs(player.rating - avgTeamRating);
  
  return positionScore + ratingBalanceScore * 1.5;
}

/**
 * Optimizes teams by swapping players to balance positions and ratings
 */
function optimizeTeams(teams: Team[], teamSizes: number[]): void {
  const MAX_ITERATIONS = 100;
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let improved = false;
    
    // Calculate team statistics
    const teamStats = teams.map(team => calculateTeamStats(team));
    
    // Randomize the order in which we compare teams
    const teamPairs: [number, number][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        teamPairs.push([i, j]);
      }
    }
    
    // Shuffle the team pairs
    for (let i = teamPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamPairs[i], teamPairs[j]] = [teamPairs[j], teamPairs[i]];
    }
    
    // Try swapping players between teams in random order
    for (const [i, j] of teamPairs) {
      // Attempt player swaps
      if (trySwapPlayers(teams[i], teams[j], teamStats[i], teamStats[j])) {
        improved = true;
        
        // Update statistics
        teamStats[i] = calculateTeamStats(teams[i]);
        teamStats[j] = calculateTeamStats(teams[j]);
      }
    }
    
    // If no improvements were made, we're done
    if (!improved) break;
  }
  
  // Final adjustment for uneven teams
  handleUnevenTeams(teams, teamSizes);
}

/**
 * Tries to swap players between teams to improve balance
 */
function trySwapPlayers(
  teamA: Team,
  teamB: Team,
  statsA: TeamStats,
  statsB: TeamStats
): boolean {
  // Calculate current imbalances
  const currentRatingDiff = Math.abs(statsA.averageRating - statsB.averageRating);
  const currentStdDevDiff = Math.abs(statsA.stdDev - statsB.stdDev);
  const currentPositionImbalance = calculatePositionImbalance(statsA.positionCounts, statsB.positionCounts);
  
  const currentScore = currentRatingDiff * 3 + currentStdDevDiff * 2 + currentPositionImbalance;
  
  // Create arrays of player indices
  const playerIndicesA = Array.from({ length: teamA.players.length }, (_, i) => i);
  const playerIndicesB = Array.from({ length: teamB.players.length }, (_, i) => i);
  
  // Shuffle the player indices for randomized swapping
  shuffleArray(playerIndicesA);
  shuffleArray(playerIndicesB);
  
  // Try all possible player swaps
  for (const i of playerIndicesA) {
    for (const j of playerIndicesB) {
      const playerA = teamA.players[i];
      const playerB = teamB.players[j];
      
      // Simulate swap
      teamA.players[i] = playerB;
      teamB.players[j] = playerA;
      
      // Calculate new stats
      const newStatsA = calculateTeamStats(teamA);
      const newStatsB = calculateTeamStats(teamB);
      
      // Calculate new imbalances
      const newRatingDiff = Math.abs(newStatsA.averageRating - newStatsB.averageRating);
      const newStdDevDiff = Math.abs(newStatsA.stdDev - newStatsB.stdDev);
      const newPositionImbalance = calculatePositionImbalance(newStatsA.positionCounts, newStatsB.positionCounts);
      
      const newScore = newRatingDiff * 3 + newStdDevDiff * 2 + newPositionImbalance;
      
      // Keep swap if it improves the score
      if (newScore < currentScore) {
        return true;
      }
      
      // Revert swap
      teamA.players[i] = playerA;
      teamB.players[j] = playerB;
    }
  }
  
  return false;
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
 * Handles uneven teams by ensuring larger teams have slightly lower average ratings
 */
function handleUnevenTeams(teams: Team[], teamSizes: number[]): void {
  // Check if we have uneven teams
  if (new Set(teamSizes).size === 1) return;
  
  // Sort teams by size (larger teams first)
  const sortedTeamIndices = teams
    .map((team, index) => ({ team, index, size: team.players.length }))
    .sort((a, b) => b.size - a.size);
  
  // Calculate average ratings
  const avgRatings = teams.map(team => calculateAverageRating(team.players));
  
  // Adjust ratings for uneven teams by swapping high/low rated players
  for (let i = 0; i < Math.floor(teams.length / 2); i++) {
    const largerTeamIndex = sortedTeamIndices[i].index;
    const smallerTeamIndex = sortedTeamIndices[teams.length - 1 - i].index;
    
    // Only proceed if teams have different sizes
    if (teams[largerTeamIndex].players.length > teams[smallerTeamIndex].players.length) {
      // If larger team has higher average rating, try to swap players
      if (avgRatings[largerTeamIndex] > avgRatings[smallerTeamIndex]) {
        adjustRatingsBetweenUnevenTeams(
          teams[largerTeamIndex], 
          teams[smallerTeamIndex]
        );
      }
    }
  }
}

/**
 * Adjusts ratings between two uneven teams by swapping players
 */
function adjustRatingsBetweenUnevenTeams(
  largerTeam: Team,
  smallerTeam: Team
): void {
  // Sort players in each team by rating
  const sortedLargerTeam = [...largerTeam.players].sort((a, b) => b.rating - a.rating);
  const sortedSmallerTeam = [...smallerTeam.players].sort((a, b) => a.rating - b.rating);
  
  // Number of players to potentially swap (proportional to team size difference)
  const sizeDifference = largerTeam.players.length - smallerTeam.players.length;
  const swapsToTry = Math.min(
    Math.ceil(sizeDifference / 2), 
    Math.floor(Math.min(largerTeam.players.length, smallerTeam.players.length) / 3)
  );
  
  // Try swapping top players from larger team with bottom players from smaller team
  for (let i = 0; i < swapsToTry; i++) {
    if (i >= sortedLargerTeam.length || i >= sortedSmallerTeam.length) break;
    
    const topPlayerFromLargerTeam = sortedLargerTeam[i];
    const bottomPlayerFromSmallerTeam = sortedSmallerTeam[sortedSmallerTeam.length - 1 - i];
    
    // Only swap if it makes sense rating-wise
    if (topPlayerFromLargerTeam.rating > bottomPlayerFromSmallerTeam.rating) {
      // Find these players in the original arrays
      const largerTeamPlayerIndex = largerTeam.players.findIndex(p => p.name === topPlayerFromLargerTeam.name);
      const smallerTeamPlayerIndex = smallerTeam.players.findIndex(p => p.name === bottomPlayerFromSmallerTeam.name);
      
      // Make sure we found the players
      if (largerTeamPlayerIndex !== -1 && smallerTeamPlayerIndex !== -1) {
        // Swap the players
        const temp = largerTeam.players[largerTeamPlayerIndex];
        largerTeam.players[largerTeamPlayerIndex] = smallerTeam.players[smallerTeamPlayerIndex];
        smallerTeam.players[smallerTeamPlayerIndex] = temp;
      }
    }
  }
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