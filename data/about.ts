import heroimage1 from "@/app/assets/hero-slider/image1.png";
import heroimage2 from "@/app/assets/hero-slider/image2.png";
import heroimage3 from "@/app/assets/hero-slider/image3.png";
import kidsImage from "@/app/assets/category/kids-image.jpg";

export type AboutValue = {
  title: string;
  description: string;
};

export type AboutMilestone = {
  year: string;
  title: string;
  description: string;
};

export type AboutGalleryImage = {
  src: string;
  alt: string;
};

export const aboutIntro = {
  title: "About VELVORZ",
  tagline: "Uncompromising precision, worn every day.",
  description:
    "VELVORZ is a modern clothing label built around refined essentials — oversized hoodies, structured trousers, leather sneakers, and pieces designed to move with you. We edit every collection with intention so your wardrobe stays focused, not crowded.",
};

export const aboutHeroImage = {
  src: heroimage1.src,
  alt: "VELVORZ model wearing the latest collection outerwear",
};

export const aboutStoryImage = {
  src: heroimage2.src,
  alt: "Tailored motion — VELVORZ lookbook still",
};

export const aboutGalleryImages: AboutGalleryImage[] = [
  {
    src: heroimage3.src,
    alt: "Refined essentials from the VELVORZ collection",
  },
  {
    src: "/temp/hoodie.png",
    alt: "Signature Oversized Hoodie",
  },
  {
    src: "/temp/shoo.png",
    alt: "Monolith Leather Sneakers",
  },
  {
    src: kidsImage.src,
    alt: "VELVORZ kids collection",
  },
];

export const aboutStory = {
  title: "Our Story",
  paragraphs: [
    "VELVORZ started with a simple question: why should everyday clothing feel disposable? We set out to build a label where every piece — from a cotton tee to a pair of cargo trousers — is cut, finished, and priced with the same care.",
    "Our collections span men, women, kids, and accessories. Each category is edited down to what actually gets worn: clean silhouettes, durable fabrics, and details that hold up wash after wash.",
    "We release fewer styles on purpose. When you shop VELVORZ, you are not chasing trends — you are building a wardrobe that lasts.",
  ],
};

export const aboutValues: AboutValue[] = [
  {
    title: "Fit & Form",
    description:
      "Proportions are tuned for real movement — relaxed where it matters, structured where it counts.",
  },
  {
    title: "Honest Materials",
    description:
      "Cotton, leather, and heavyweight knits chosen for how they feel now and how they age over time.",
  },
  {
    title: "Edited Assortment",
    description:
      "Every item in the shop earns its place. No filler, no noise — just pieces you will reach for again and again.",
  },
];

export const aboutMilestones: AboutMilestone[] = [
  {
    year: "2019",
    title: "VELVORZ Launches",
    description:
      "First drop of essentials — tees, hoodies, and outerwear — sold direct to customers online.",
  },
  {
    year: "2021",
    title: "Footwear & Accessories",
    description:
      "Expanded into leather sneakers, bags, and seasonal accessories alongside core apparel.",
  },
  {
    year: "2024",
    title: "Full Collection",
    description:
      "Men, women, kids, and accessories available nationwide with free returns on every order.",
  },
];

export const aboutCraft = {
  title: "Quality You Can Feel",
  description:
    "From fabric sourcing to final inspection, we work with partners who meet our standards for workmanship and fair labor. Packaging is kept minimal, production runs are controlled, and we are always looking for ways to reduce waste without cutting corners on the garment itself.",
};
