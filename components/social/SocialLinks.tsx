import type { LucideIcon } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/icons/social";
import { socialLinks } from "@/data/landing";
import type { SocialLink } from "@/lib/types";

const socialIconMap: Record<SocialLink["icon"], LucideIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  tiktok: TiktokIcon,
};

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
};

export function SocialLinks({
  className = "flex items-center gap-4",
  iconClassName = "h-5 w-5",
  linkClassName = "text-inverse-primary transition-colors hover:text-on-primary",
}: SocialLinksProps) {
  return (
    <div className={className}>
      {socialLinks.map((link) => {
        const Icon = socialIconMap[link.icon];

        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={linkClassName}
          >
            <Icon className={iconClassName} strokeWidth={1.5} />
          </a>
        );
      })}
    </div>
  );
}
