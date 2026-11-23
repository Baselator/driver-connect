// DriverConnect brand theme. Change colors here and the whole app updates.
export const colors = {
  navy: "#11354E", // primary buttons & navigation
  navyDark: "#0B2536",
  navyLight: "#E3EAF0",
  teal: "#4DB7B2", // availability & confirmations
  tealDark: "#2E8F8A",
  tealLight: "#E1F3F2",
  offWhite: "#F3F0EA", // backgrounds
  orange: "#F2A160", // map markers & accents
  orangeDark: "#D9803A",
  orangeLight: "#FCEBDD",
  white: "#FFFFFF",
  text: "#11354E",
  textMuted: "#5E6E7A",
  border: "#E4DFD5",
  gray: "#9AA3AB",
  grayLight: "#ECEAE6",
  danger: "#C9483B",
  dangerLight: "#F8E1DE",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: { boxShadow: "0px 4px 14px rgba(17, 53, 78, 0.08)" },
  floating: { boxShadow: "0px 8px 24px rgba(17, 53, 78, 0.18)" },
};

export const type = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  small: { fontSize: 14, color: colors.textMuted },
  tiny: { fontSize: 12, color: colors.textMuted },
};
