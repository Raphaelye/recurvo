import type { ImageSourcePropType, ImageResizeMode } from "react-native";

import { images } from "@/constants/images";

export type OnboardingSlide = {
  title: string;
  description: string;
  image: ImageSourcePropType;
  // Position and size of the image inside the top area, measured on the 402 x 874 design frame.
  imageClassName: string;
  resizeMode: ImageResizeMode;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    title: "Welcome to Recurvo!",
    description:
      "Control and track all your subscription payments in one place. No more surprise charges.",
    image: images.onboarding1,
    imageClassName: "absolute inset-x-0 bottom-0 h-[290px] w-full",
    resizeMode: "cover",
  },
  {
    title: "Timely Renewals!!",
    description:
      "Never miss a renewal date again…Get smart reminders before subscriptions renewals.",
    image: images.onboarding2,
    imageClassName: "absolute bottom-0 left-5 h-[492px] w-[250px]",
    resizeMode: "contain",
  },
  {
    title: "Tailored Insights!!!",
    description:
      "Get tailored data on your average monthly spending. Make smarter financial decisions with Recurvo.",
    image: images.onboarding3,
    imageClassName: "absolute bottom-0 -left-[171px] h-[480px] w-[548px]",
    resizeMode: "contain",
  },
];
