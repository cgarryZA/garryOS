import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { AxiosRequestConfig } from 'axios'

// Generic hook for GET requests
export function useApiQuery<T>(
  key: string | string[],
  url: string,
  config?: AxiosRequestConfig
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await apiClient.get<T>(url, config)
      return response.data
    },
  })
}

// Generic hook for POST/PUT/DELETE requests
export function useApiMutation<TData, TVariables>(
  method: 'post' | 'put' | 'delete',
  url: string,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
    invalidateKeys?: string[]
  }
) {
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await apiClient[method]<TData>(url, variables)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate and refetch queries
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}
