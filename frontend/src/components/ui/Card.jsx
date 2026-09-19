import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
          rounded-[12px]
          border
          border-[#dedbd5]
          bg-[#fffefa]
          shadow-[0_1px_3px_rgba(32,30,27,0.06)]
        `,
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';


const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
          flex
          flex-col
          space-y-1.5
          px-5
          pt-5
          pb-4
        `,
        className
      )}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';


const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        `
          text-[15px]
          font-semibold
          leading-5
          tracking-[-0.01em]
          text-[#201e1b]
        `,
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';


const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        `
          text-[12px]
          leading-[1.35rem]
          text-[#817c74]
        `,
        className
      )}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';


const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
          px-5
          pb-5
        `,
        className
      )}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';


const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
          flex
          items-center
          border-t
          border-[#e8e5df]
          px-5
          py-3.5
        `,
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';


export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};