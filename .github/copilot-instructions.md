<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

// Build a React + TypeScript component called RecordGame.
// This component allows a logged-in user to record the results of a match they've played against a coworker in a company sport (e.g., Ping Pong, Foosball, Pool).

// Features:
// - Dropdown to select the sport played
// - Dropdown to select opponent (list of users from Firestore, excluding current user)
// - Numeric inputs for score (e.g., "Your Score", "Opponent's Score")
// - Auto-set the winner based on score
// - Submit button to record match result

// On submit:
// - Save match result to Firestore in a "matches" collection:
//   {
//     id,
//     player1Id: current user,
//     player2Id: selected opponent,
//     sport,
//     score: { player1: number, player2: number },
//     winnerId,
//     createdAt,
//     status: 'completed'
//   }

// Requirements:
// - Validate that opponent is selected and scores are positive numbers
// - Prevent submission if player1Id === player2Id
// - Show confirmation or error message after saving
// - Use TypeScript interfaces for Match and Score types
// - Use Firestore Timestamp for createdAt