"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function QuestionFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-white rounded-2xl shadow-md border-transparent">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 w-full">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="w-2/3 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-6 w-1/6 hidden sm:block" />
            </div>
            <div className="space-y-3 ml-12 pl-1 border-l-2 border-gray-100/80">
              <div className="pl-4 space-y-3">
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-5 md:px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex gap-4">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-10" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
