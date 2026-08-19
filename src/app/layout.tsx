import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
// import FacebookPixel from "@/components/FacebookPixel";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Crystal Dreams",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e7e6e4] text-slate-800">
        <LayoutWrapper>
          {/* <Suspense fallback={null}>
            <FacebookPixel />
          </Suspense> */}
          <CartProvider>{children}</CartProvider>
        </LayoutWrapper>
      </body>
    </html>
  );
}
