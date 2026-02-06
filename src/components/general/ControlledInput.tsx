import React, { useEffect, useRef, useState } from 'react';

type InputProps = React.ComponentProps<'input'>;

const ControlledInput = React.forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
   const { value, onChange, type = 'text', onFocus, ...rest } = props;
   const [cursor, setCursor] = useState<number | null>(null);
   const innerRef = useRef<HTMLInputElement>(null);
   
   // Combine refs
   const ref = (forwardedRef as React.RefObject<HTMLInputElement>) || innerRef;

   useEffect(() => {
      const input = ref.current;
      if (input && cursor !== null) {
         const supportsSelection = ['text', 'search', 'url', 'tel', 'password'].includes(type);
         
         if (supportsSelection) {
            input.setSelectionRange(cursor, cursor);
         }
      }
   }, [cursor, value, type, ref]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target;
      const supportsSelection = ['text', 'search', 'url', 'tel', 'password'].includes(type);
      
      if (supportsSelection) {
         setCursor(target.selectionStart);
      }
      
      onChange?.(e);
   };

   const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
   };

   return (
      <input 
         ref={ref} 
         type={type} 
         value={value} 
         onChange={handleChange} 
         onFocus={handleFocus}
         {...rest} 
      />
   );
});

ControlledInput.displayName = 'ControlledInput';

export default ControlledInput;