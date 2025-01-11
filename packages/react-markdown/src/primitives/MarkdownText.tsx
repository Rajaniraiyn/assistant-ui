"use client";

import { INTERNAL, useContentPartText } from "@assistant-ui/react";
import {
  ComponentRef,
  ElementType,
  forwardRef,
  ForwardRefExoticComponent,
  RefAttributes,
  type ComponentPropsWithoutRef,
  type ComponentType,
} from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { SyntaxHighlighterProps, CodeHeaderProps } from "../overrides/types";
import { PreOverride } from "../overrides/PreOverride";
import {
  DefaultPre,
  DefaultCode,
  DefaultCodeBlockContent,
  DefaultCodeHeader,
} from "../overrides/defaultComponents";
import { CodeOverride } from "../overrides/CodeOverride";
import { Primitive } from "@radix-ui/react-primitive";
import classNames from "classnames";
import { marked } from 'marked';
import { memo, useMemo } from 'react';

const { useSmooth } = INTERNAL;

type MarkdownTextPrimitiveElement = ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>;

export type MarkdownTextPrimitiveProps = Omit<
  Options,
  "components" | "children"
> & {
  containerProps?: Omit<PrimitiveDivProps, "children" | "asChild"> | undefined;
  containerComponent?: ElementType | undefined;
  components?:
    | (NonNullable<Options["components"]> & {
        SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps> | undefined;
        CodeHeader?: ComponentType<CodeHeaderProps> | undefined;
        /**
         * @deprecated Use `componentsByLanguage` instead of `components.by_language`. This will be removed in the next major version.
         **/
        by_language?: undefined;
      })
    | undefined;
  componentsByLanguage?:
    | Record<
        string,
        {
          CodeHeader?: ComponentType<CodeHeaderProps> | undefined;
          SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps> | undefined;
        }
      >
    | undefined;
  smooth?: boolean | undefined;
};

const MemoizedMarkdownBlock = memo(
  ({ content, components, ...rest }: { content: string; components: Options['components'] } & Omit<Options, "components" | "children">) => {
    return <ReactMarkdown components={components} {...rest}>{content}</ReactMarkdown>;
  }
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MarkdownTextPrimitive: ForwardRefExoticComponent<MarkdownTextPrimitiveProps> &
  RefAttributes<MarkdownTextPrimitiveElement> = forwardRef<
  MarkdownTextPrimitiveElement,
  MarkdownTextPrimitiveProps
>(
  (
    {
      components: userComponents,
      componentsByLanguage = userComponents?.by_language,
      className,
      containerProps,
      containerComponent: Container = "div",
      smooth = true,
      ...rest
    },
    forwardedRef,
  ) => {
    const { text, status } = useSmooth(useContentPartText(), smooth);

    const components = useMemo(() => ({
      ...userComponents,
      pre: PreOverride,
      code: (props: any) => (
        <CodeOverride
          components={{
            Pre: userComponents?.pre ?? DefaultPre,
            Code: userComponents?.code ?? DefaultCode,
            SyntaxHighlighter: userComponents?.SyntaxHighlighter ?? DefaultCodeBlockContent,
            CodeHeader: userComponents?.CodeHeader ?? DefaultCodeHeader,
          }}
          componentsByLanguage={componentsByLanguage}
          {...props}
        />
      ),
    }), [userComponents, componentsByLanguage]);

    const blocks = useMemo(() => {
      const tokens = marked.lexer(text);
      return tokens.map(token => token.raw);
    }, [text]);

    return (
      <Container
        data-status={status.type}
        {...containerProps}
        className={classNames(className, containerProps?.className)}
        ref={forwardedRef}
      >
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock
            key={`block-${index}`}
            content={block}
            components={components}
            {...rest}
          />
        ))}
      </Container>
    );
  },
);

MarkdownTextPrimitive.displayName = "MarkdownTextPrimitive";
