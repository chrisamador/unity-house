import {
  Montserrat_300Light,
  Montserrat_300Light_Italic,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
  Montserrat_600SemiBold,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold,
  Montserrat_700Bold_Italic,
  Montserrat_800ExtraBold,
  Montserrat_800ExtraBold_Italic,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
} from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    "montserrat-light": Montserrat_300Light,
    "montserrat-light-italic": Montserrat_300Light_Italic,
    "montserrat-regular": Montserrat_400Regular,
    "montserrat-regular-italic": Montserrat_400Regular_Italic,
    "montserrat-medium": Montserrat_500Medium,
    "montserrat-medium-italic": Montserrat_500Medium_Italic,
    "montserrat-semibold": Montserrat_600SemiBold,
    "montserrat-semibold-italic": Montserrat_600SemiBold_Italic,
    "montserrat-bold": Montserrat_700Bold,
    "montserrat-bold-italic": Montserrat_700Bold_Italic,
    "montserrat-extrabold": Montserrat_800ExtraBold,
    "montserrat-extrabold-italic": Montserrat_800ExtraBold_Italic,
    "montserrat-black": Montserrat_900Black,
    "montserrat-black-italic": Montserrat_900Black_Italic,
  });

  return fontsLoaded;
}
