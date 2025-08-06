import { toast } from 'sonner'

export function useToast() {
  return {
    toast: (options) => {
      if (typeof options === 'string') {
        toast(options)
      } else {
        const { title, description, variant } = options
        
        if (variant === 'destructive') {
          toast.error(title, {
            description
          })
        } else {
          toast.success(title, {
            description
          })
        }
      }
    }
  }
}

