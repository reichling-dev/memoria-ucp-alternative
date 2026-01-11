declare module '@/components/ui/switch' {
  import * as React from 'react'
  export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
  }
  export const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>
}
