import React, { createContext, useContext, useState } from "react"

const BulkActionContext = createContext(undefined)

export function BulkActionProvider({ children }) {
  const [selectedFiles, setSelectedFiles] = useState(new Set())

  const toggleFile = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const toggleAll = (fileIds, selectAll) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (selectAll) {
        fileIds.forEach(id => newSet.add(id))
      } else {
        fileIds.forEach(id => newSet.delete(id))
      }
      return newSet
    })
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  return (
    <BulkActionContext.Provider value={{ selectedFiles, toggleFile, toggleAll, clearSelection }}>
      {children}
    </BulkActionContext.Provider>
  )
}

export function useBulkAction() {
  const context = useContext(BulkActionContext)
  if (context === undefined) {
    throw new Error("useBulkAction must be used within a BulkActionProvider")
  }
  return context
}
