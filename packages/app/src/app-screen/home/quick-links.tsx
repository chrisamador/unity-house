import { TextStyled } from '@/ui/components/Text';
import { Link, LinkProps } from 'expo-router';
import { View } from 'react-native';

export function QuickLinks() {
  return (
    <View className="container md:flex-row md:items-center gap-4 md:gap-8 p-4 md:py-8">
      <View>
        <TextStyled weight="bold" className='uppercase tracking-wider'>
          Quick Links
        </TextStyled>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <QuickLink href="/events" label="Events" />
        <QuickLink href="/updates" label="Updates" />
        <QuickLink href="/academics" label="Academics" />
        <QuickLink href="/profile" label="Profile" />
      </View>
    </View>
  );
}

function QuickLink({ href, label }: { href: LinkProps['href']; label: string }) {
  return (
    <View>
      <Link href={href} className="p-2 bg-primary-500/10 rounded px-4 inline-flex">
        <TextStyled color="primary" weight="semibold">{label}</TextStyled>
      </Link>
    </View>
  );
}
