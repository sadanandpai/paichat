import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden">
      <Chat />
    </main>
  );
}
