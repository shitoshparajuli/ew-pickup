import Link from 'next/link';
import { Game } from '@/data/types';
import { getAllGames } from '@/lib/games';

export default async function GamesPage() {
  // Fetch games using our utility function
  const games = await getAllGames();
  const upcomingGames = games.filter(game => game.status === 'UPCOMING');
  const pastGames = games.filter(game => game.status === 'COMPLETED');

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Soccer Pickup Games</h1>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Upcoming Games</h2>
          <div className="space-y-4">
            {upcomingGames.map(game => (
              <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold dark:text-white">{game.date} at {game.time}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{game.location}</p>
                    <p className="mt-2 dark:text-gray-200">
                      Players: <span className="font-medium">{game.playersCount}</span>
                    </p>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
            {upcomingGames.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming games scheduled</p>
            )}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Past Games</h2>
          <div className="space-y-4">
            {pastGames.map(game => (
              <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 opacity-80">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold dark:text-white">{game.date} at {game.time}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{game.location}</p>
                    <p className="mt-2 dark:text-gray-200">
                      Players: <span className="font-medium">{game.playersCount}</span>
                    </p>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                      View Summary
                    </button>
                  </Link>
                </div>
              </div>
            ))}
            {pastGames.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No past games</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
