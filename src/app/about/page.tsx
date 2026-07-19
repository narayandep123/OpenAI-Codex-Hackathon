import { TeamCard } from "@/components/team/team-card";

const teamMembers: Array<{ name: string; role: string; imageUrl?: string; imageClassName?: string; linkedinUrl?: string }> = [
  {
    name: "Aditi Prasad",
    role: "SDE & Product Lead",
    imageUrl: "/team/aditi.png",
    linkedinUrl: "https://www.linkedin.com/in/aditi-prasad-0525b922a/",
  },
  {
    name: "Mayank Prasad",
    role: "SDE",
    imageUrl: "/team/mayank.jpg",
    imageClassName: "scale-125",
    linkedinUrl: "https://www.linkedin.com/in/mayank-prasad-2632ab423/",
  },
  {
    name: "Deepnarayan Lohra",
    role: "SDE",
    imageUrl: "/team/deepnarayan.png",
    linkedinUrl: "https://in.linkedin.com/in/deepnarayan-lohra-355696112",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-8 sm:py-10">
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">About SurgiFind</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-[3.35rem]">
          Making surgery discovery transparent and patient-first.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
          SurgiFind helps patients compare hospitals, understand cost ranges, and find suitable options faster.
          We are building a trusted healthcare navigation layer that combines real-world provider data with
          simple, explainable tools.
        </p>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
          Our goal is to reduce uncertainty before treatment decisions and make high-quality care easier to access.
        </p>
      </section>

      <section className="space-y-10 py-4 pb-16 text-center sm:pb-20">
        <h2 className="text-3xl font-semibold text-slate-900">Meet the team</h2>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-10">
          {teamMembers.map((member) => (
            <TeamCard
              key={member.name}
              name={member.name}
              role={member.role}
              imageUrl={member.imageUrl}
              imageClassName={member.imageClassName}
              linkedinUrl={member.linkedinUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}