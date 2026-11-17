import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { PHOTO_CREDITS } from "@/lib/photo-credits";

export const metadata: Metadata = {
  title: "Photo Credits",
  description: "Sources and licences for the product photos used on VSM Godavari Foods.",
  alternates: { canonical: "/photo-credits" },
};

export default function PhotoCredits() {
  return (
    <PolicyPage title="Photo Credits" telugu="ఫోటో క్రెడిట్స్">
      <p className="mt-6">Some product and scenery photos on this site are representative images from Wikimedia Commons and Flickr, used under their Creative Commons or public-domain licences. They have been cropped and resized, and some have been cut out and combined with illustrated bowls, jars and leaves; those adapted images are shared under the same licence as the original. Thank you to the photographers below.</p>
      <ul>
        {PHOTO_CREDITS.map((c) => (
          <li key={c.art}>
            <a href={c.source} target="_blank" rel="noopener noreferrer">{c.title}</a> by {c.author}, licensed under{" "}
            <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a>
          </li>
        ))}
      </ul>
    </PolicyPage>
  );
}
