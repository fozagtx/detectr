"use client";

/** HeroUI Pro Marketing/hero-sections (4)__centered-navbar — Detectr */
import type { NavbarProps } from "@heroui/react";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
  Divider,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Logo } from "@/components/logo";

const MENU = [
  { label: "Home", href: "#top" },
  { label: "Why Detectr", href: "#why" },
  { label: "Build a case", href: "#case-form" },
  { label: "Ask", href: "#link-prompt" },
] as const;

export type CenteredNavbarProps = NavbarProps & {
  onGetStarted?: () => void;
};

const CenteredNavbar = React.forwardRef<HTMLElement, CenteredNavbarProps>(
  (
    {
      classNames: { base, wrapper, ...otherClassNames } = {},
      onGetStarted,
      ...props
    },
    ref,
  ) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
      <Navbar
        ref={ref}
        classNames={{
          base: cn(
            "max-w-xs sm:max-w-md md:max-w-screen-sm mx-auto bg-default-foreground rounded-full px-1.5 pr-[18px] md:pr-1.5 py-[5px] top-4 shadow-[0_4px_15px_0_rgba(0,0,0,0.25)] z-40",
            base,
          ),
          wrapper: cn("px-0", wrapper),
          ...otherClassNames,
        }}
        height="40px"
        isMenuOpen={isMenuOpen}
        position="static"
        onMenuOpenChange={setIsMenuOpen}
        {...props}
      >
        <NavbarBrand>
          <Logo
            size={28}
            withWordmark
            wordmarkClassName="text-background"
          />
        </NavbarBrand>

        <NavbarContent className="hidden md:flex" justify="center">
          {MENU.map((item, i) => (
            <NavbarItem key={item.href} isActive={i === 0}>
              <Link
                aria-current={i === 0 ? "page" : undefined}
                className={
                  i === 0 ? "text-background" : "text-default-500"
                }
                href={item.href}
                size="sm"
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent className="hidden md:flex" justify="end">
          <NavbarItem>
            <Button
              as={Link}
              href="#case-form"
              className="bg-background font-medium text-default-foreground"
              endContent={
                <Icon
                  className="pointer-events-none"
                  icon="solar:alt-arrow-right-linear"
                />
              }
              radius="full"
              onPress={() => {
                setIsMenuOpen(false);
                onGetStarted?.();
              }}
            >
              Get Started
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenuToggle className="text-default-400 md:hidden" />

        <NavbarMenu
          className="bottom-0 top-[initial] max-h-fit rounded-t-2xl bg-default-200/50 pb-6 pt-6 shadow-medium backdrop-blur-md backdrop-saturate-150"
          motionProps={{
            initial: { y: "100%" },
            animate: { y: 0 },
            exit: { y: "100%" },
            transition: { type: "spring", bounce: 0, duration: 0.3 },
          }}
        >
          {MENU.map((item, index) => (
            <NavbarMenuItem key={item.href}>
              <Link
                className="mb-2 w-full text-default-500"
                href={item.href}
                size="md"
                onPress={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
              {index < MENU.length - 1 && (
                <Divider className="opacity-50" />
              )}
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem className="mb-4 mt-2">
            <Button
              fullWidth
              as={Link}
              href="#case-form"
              className="bg-foreground text-background"
              radius="full"
              onPress={() => {
                setIsMenuOpen(false);
                onGetStarted?.();
              }}
            >
              Get Started
            </Button>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>
    );
  },
);

CenteredNavbar.displayName = "CenteredNavbar";

export default CenteredNavbar;
