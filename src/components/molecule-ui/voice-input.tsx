"use client"

import React from "react"
import { AnimatePresence, motion } from "motion/react"
import { XClose } from "@untitledui/icons"

import { cn } from "@/lib/utils"

export interface VoiceInputProps {
  /**
   * Whether the component is currently recording (controlled mode)
   */
  isRecording: boolean
  /**
   * Current recording time in seconds (controlled mode)
   */
  recordingTime: number
  /**
   * Callback function called when stop button is clicked
   */
  onStop?: () => void
  /**
   * Callback function called when cancel button is clicked
   */
  onCancel?: () => void
}

export function VoiceInput({
  className,
  isRecording,
  recordingTime,
  onStop,
  onCancel,
  ...props
}: React.ComponentProps<"div"> & VoiceInputProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      {...props}
    >
      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted transition-colors"
      >
        <XClose className="h-4 w-4" />
      </button>

      <motion.div
        className="flex cursor-pointer items-center justify-center rounded-full border p-2"
        layout
        transition={{
          layout: {
            duration: 0.4,
          },
        }}
        onClick={onStop}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          <motion.div
            className="bg-destructive h-4 w-4 rounded-sm"
            animate={{
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{
                duration: 0.4,
              }}
              className="flex items-center justify-center gap-2 overflow-hidden"
            >
              {/* Frequency Animation */}
              <div className="flex items-center justify-center gap-0.5">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-primary w-0.5 rounded-full"
                    initial={{ height: 2 }}
                    animate={{
                      height: [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              {/* Timer */}
              <div className="text-muted-foreground w-10 text-center text-xs">
                {formatTime(recordingTime)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
