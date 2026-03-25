import { XIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Record {
  id: string
  title: string
  data: { [key: string]: any }
}

interface FullScreenModalProps {
  record: Record | undefined
  onClose: () => void
}

export function FullScreenModal({ record, onClose }: FullScreenModalProps) {
  if (!record) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform scale-95 hover:scale-100">
        <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-gradient-to-r from-blue-100 to-purple-100">
          <h2 className="text-2xl font-semibold text-blue-800">{record.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-blue-600 hover:text-blue-800">
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)] p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(record.data).map(([key, value]) => (
              <div key={key} className="bg-blue-50 bg-opacity-90 p-4 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                <h3 className="text-lg font-medium text-blue-700 mb-2">{key}</h3>
                <p className="text-xl text-blue-600">
                  {Array.isArray(value) ? value.join(", ") : value}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

