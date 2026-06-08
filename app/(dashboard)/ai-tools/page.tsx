import { Sparkles, Wand2, FileText, Image, BarChart3 } from "lucide-react";

const upcoming = [
  {
    icon: Wand2,
    label: "AI Bio Writer",
    desc: "Generate a compelling creator bio in seconds based on your portfolio.",
  },
  {
    icon: FileText,
    label: "Product Description Generator",
    desc: "Write high-converting product descriptions from a brief summary.",
  },
  {
    icon: Image,
    label: "Image Background Remover",
    desc: "Automatically remove backgrounds from product photos.",
  },
  {
    icon: BarChart3,
    label: "Campaign Goal Advisor",
    desc: "Get AI-powered suggestions for crowdfunding goals and reward tiers.",
  },
];

export default function AIToolsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2e9cfe 0%, #a78bfa 100%)" }}>
        <Sparkles className="w-9 h-9 text-white" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[11px] font-bold uppercase tracking-wider">
          Coming Soon
        </div>
        <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
        <p className="text-gray-500 text-[14px] leading-relaxed max-w-md mx-auto">
          Supercharge your creator workflow with AI-powered tools built right into your dashboard. We're putting the finishing touches on the first batch.
        </p>
      </div>

      {/* Upcoming tools */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {upcoming.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-[13px] text-gray-800">{label}</p>
              <p className="text-gray-400 text-[12px] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-[12px]">
        We'll notify you as soon as AI Tools go live.
      </p>
    </div>
  );
}
