import { XIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Record {
  id: string
  title: string
  data: { [key: string]: any }
}

interface PreviewPanelProps {
  record: Record | undefined
  onClose: () => void
}

export function PreviewPanel({ record, onClose }: PreviewPanelProps) {
  if (!record) {
    return null
  }

  return (
    <div className="w-1/3 bg-gradient-to-b from-purple-50 to-blue-50 border-l border-purple-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-purple-200 flex justify-between items-center bg-white bg-opacity-50">
        <h2 className="text-xl font-semibold text-purple-800">{record.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-purple-600 hover:text-purple-800">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-4">
        {Object.entries(record.data).map(([key, value]) => (
          <div key={key} className="mb-4 bg-white bg-opacity-50 p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-purple-600 mb-1">{key}</h3>
            <p className="text-lg text-gray-800">
              {Array.isArray(value) ? value.join(", ") : value}
            </p>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}

