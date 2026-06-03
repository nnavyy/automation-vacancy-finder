export default async function Template({ children }: { children: React.ReactNode }) {
  // Memberikan artificial delay selama 2 detik (2000 ms) 
  // agar efek skeleton/loading screen bisa terlihat jelas saat navigasi
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return <>{children}</>;
}
