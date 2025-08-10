import Image from "next/image"

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 relative">
        <Image
          src="/logo.png"
          alt="SoonerFlow"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>
      <span className="text-lg font-bold text-foreground">SoonerFlow</span>
    </div>
  )
}