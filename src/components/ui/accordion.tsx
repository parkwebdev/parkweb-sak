/**
 * Accordion Component
 * 
 * An animated, accessible accordion component built on Radix UI primitives
 * with smooth expand/collapse animations using Framer Motion.
 * 
 * @module components/ui/accordion
 * 
 * @example
 * ```tsx
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section Title</AccordionTrigger>
 *     <AccordionContent>Content goes here</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "@untitledui/icons"
import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react"

import { cn } from "@/lib/utils"
import { useControlledState } from "@/hooks/use-controlled-state"
import { getStrictContext } from "@/lib/get-strict-context"

type AccordionContextType = {
  value: string | string[] | undefined;
  setValue: (value: string | string[] | undefined) => void;
};

type AccordionItemContextType = {
  value: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const [AccordionProvider, useAccordion] =
  getStrictContext<AccordionContextType>('AccordionContext');

const [AccordionItemProvider, useAccordionItem] =
  getStrictContext<AccordionItemContextType>('AccordionItemContext');

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  const [value, setValue] = useControlledState<string | string[] | undefined>({
    value: props?.value,
    defaultValue: props?.defaultValue,
    onChange: props?.onValueChange as (
      value: string | string[] | undefined,
    ) => void,
  });

  return (
    <AccordionProvider value={{ value, setValue }}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        className={cn("bg-primary-foreground rounded-lg border px-5", className)}
        {...props}
        value={value as string & string[]}
        onValueChange={setValue as ((value: string) => void) & ((value: string[]) => void)}
      />
    </AccordionProvider>
  )
}

function AccordionItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const { value } = useAccordion();
  const [isOpen, setIsOpen] = React.useState(
    Array.isArray(value) ? value.includes(props?.value) : value === props?.value
  );

  React.useEffect(() => {
    setIsOpen(
      Array.isArray(value) ? value.includes(props?.value) : value === props?.value
    );
  }, [value, props?.value]);

  return (
    <AccordionItemProvider value={{ isOpen, setIsOpen, value: props.value }}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn("relative border-b last:border-b-0", className)}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    </AccordionItemProvider>
  )
}

function AccordionTrigger({
  children,
  className,
  showIcon = true,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  showIcon?: boolean
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-header"
        className="group active:text-foreground/50 focus-visible:bg-muted flex flex-1 items-start justify-between gap-4 py-4 font-semibold disabled:opacity-50"
        {...props}
      >
        {children}
        {showIcon && (
          <ChevronDown className="size-6 duration-300 group-data-[state=open]:rotate-180" />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  keepRendered = false,
  transition = { duration: 0.35, ease: 'easeInOut' },
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content> & {
  keepRendered?: boolean;
} & HTMLMotionProps<'div'>) {
  const { isOpen } = useAccordionItem();

  return (
    <AnimatePresence>
      {keepRendered ? (
        <AccordionPrimitive.Content
          data-slot="accordion-content"
          forceMount
          asChild
        >
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0, y: 20 }}
            animate={
              isOpen
                ? { height: 'auto', opacity: 1, y: 0 }
                : { height: 0, opacity: 0, y: 20 }
            }
            transition={transition}
            style={{ overflow: 'hidden' }}
          >
            <div className={cn("text-muted-foreground pb-4", className)}>
              {children}
            </div>
          </motion.div>
        </AccordionPrimitive.Content>
      ) : (
        isOpen && (
          <AccordionPrimitive.Content
            data-slot="accordion-content"
            forceMount
            asChild
          >
            <motion.div
              key="accordion-content"
              initial={{ height: 0, opacity: 0, y: 20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 20 }}
              transition={transition}
              style={{ overflow: 'hidden' }}
            >
              <div className={cn("text-muted-foreground pb-4", className)}>
                {children}
              </div>
            </motion.div>
          </AccordionPrimitive.Content>
        )
      )}
    </AnimatePresence>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
