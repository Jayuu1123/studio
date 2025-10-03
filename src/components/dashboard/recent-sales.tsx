import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { recentSales } from "@/lib/data"

export function RecentSales() {
  return (
    <div className="space-y-8">
        {recentSales.map((sale, index) => (
            <div className="flex items-center" key={sale.email}>
                <Avatar className="h-9 w-9">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${sale.email}`} alt="Avatar" />
                <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{sale.name}</p>
                <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
                <div className="ml-auto font-medium">{sale.amount}</div>
            </div>
        ))}
    </div>
  )
}
