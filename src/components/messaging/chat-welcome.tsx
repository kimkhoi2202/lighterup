import { MessageSquare } from "lucide-react";

interface ChatWelcomeProps {
  name: string;
  jobAddress?: string;
}

export const ChatWelcome = ({ name, jobAddress }: ChatWelcomeProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mb-4">
        <MessageSquare className="h-10 w-10 text-zinc-500 dark:text-zinc-400" />
      </div>
      <p className="text-xl md:text-2xl font-bold">
        Welcome to your conversation with {name}
      </p>
      {jobAddress && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
          Regarding job at {jobAddress}
        </p>
      )}
      <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
        No messages yet. Start the conversation!
      </p>
    </div>
  );
};

