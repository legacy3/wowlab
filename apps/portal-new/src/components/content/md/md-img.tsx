import { Image } from "@/components/ui/image";

type MdImgProps = {
  alt?: string;
  src?: string;
};

export function MdImg({ alt, src }: MdImgProps) {
  if (!src) {
    return null;
  }

  return <Image src={src} alt={alt ?? ""} expandable />;
}
