import type { Preview } from "@storybook/react-vite";
import "@i258/ui/styles.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "todo" },
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "light";
      return (
        <div
          data-theme={theme}
          style={{
            padding: 24,
            background: "var(--i258-background)",
            color: "var(--i258-foreground)",
            fontFamily: "var(--i258-font-sans)",
            minWidth: 320,
            minHeight: 120,
            borderRadius: 8,
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
