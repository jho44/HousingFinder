import { useState, useRef, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  /*
  if delay / value changes, reset timer

  timer callback should save value to state / ref and return that state / ref
  we're gonna display the debounced value so let's save it as state
  */
  const [valSaved, setValSaved] = useState(value)
  const timerId = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timerId.current = setTimeout(() => {
      setValSaved(value)
    }, delay)
    return () => clearTimeout(timerId.current)
  }, [value, delay])
  
  return valSaved;
};
