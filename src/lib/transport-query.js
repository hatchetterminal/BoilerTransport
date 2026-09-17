export const transportQueryOptions = ({
  key,
  getData,
  staleTime = Infinity,
  refetchInterval = false,
}) => ({
  queryKey: key,
  // React Query supplies a context argument. Our local loaders accept no arguments.
  queryFn: () => getData(),
  retry: false,
  staleTime,
  refetchInterval,
});
