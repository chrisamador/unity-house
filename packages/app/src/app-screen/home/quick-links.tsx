import { TextStyled } from '@/ui/components/Text';
import { Link, LinkProps } from 'expo-router';
import { View } from 'react-native';

export function QuickLinks() {
  return (
    <View className="container md:flex-row md:items-center gap-4 md:gap-8 p-4">
      <View>
        <TextStyled variant="h3" weight='bold'>Quick Links</TextStyled>
      </View>
      <View className="flex md:flex-row gap-4">
        <QuickLink href="/join" label="Join Lambda" />
        {/* <QuickLink href="/events" label="Events" />
        <QuickLink href="/chapters" label="Chapters" />
        <QuickLink href="/about" label="About Us" />
        <QuickLink href="/contact" label="Contact" /> */}
      </View>
    </View>
  );
}

function QuickLink({ href, label }: { href: LinkProps['href']; label: string }) {
  return (
    <View className="flex-1">
      <Link href={href} className="p-2 bg-primary-500 rounded ">
        <TextStyled>{label}</TextStyled>
      </Link>
    </View>
  );
}
