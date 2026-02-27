'use client';

import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function DeepSeekIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="4" fill="#4D6BFE" />
      <path d="M7 8.5C8.5 7 10.5 6.5 12 7c1.5.5 2.5 2 2 3.5-.3.9-1 1.5-2 2-1.5.7-2.5 1.5-2.5 3v1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="18.5" r="0.75" fill="#fff" />
    </svg>
  );
}

export function OpenAIIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="currentColor" />
    </svg>
  );
}

export function AnthropicIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 20 14" fill="none" {...props}>
      <path d="M13.8482 0H10.9119L16.2638 13.2H19.2L13.8482 0ZM5.35184 0L0 13.2H2.9987L4.10239 10.4382H9.70412L10.787 13.2H13.7857L8.43384 0H5.35184ZM5.0603 7.98092L6.89284 3.35077L8.72538 7.98092H5.0603Z" fill="currentColor" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 65 65" fill="none" {...props}>
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#gemini-gradient)" />
      <defs>
        <linearGradient id="gemini-gradient" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4893FC" /><stop offset=".27" stopColor="#4893FC" /><stop offset=".777" stopColor="#969DFF" /><stop offset="1" stopColor="#BD99FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MetaIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 292 191" width="21" height="14" fill="none" {...props}>
      <path d="M31.06 125.96c0 10.98 2.41 19.41 5.56 24.51 4.13 6.68 10.29 9.51 16.57 9.51 8.1 0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07 0 41.14 12.21 56.5 35.11 16.81 25.08 24.97 56.67 24.97 89.27 0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75v-31.02c17.63 0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85 0-26.8 11.2-40.23 31.17-7.14 10.61-14.47 23.54-22.7 38.13l-9.06 16.05c-18.2 32.27-22.81 39.62-31.91 51.75-15.95 21.24-29.57 29.29-47.5 29.29-21.27 0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z" fill="#0081fb" />
      <path d="M24.49 37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65 0 27.22 4.04 41.39 15.61 15.5 12.65 32.02 33.48 52.63 67.81l7.39 12.32c17.84 29.72 27.99 45.01 33.93 52.22 7.64 9.26 12.99 12.02 19.94 12.02 17.63 0 22.03-16.2 22.03-34.74l27.4-.86c0 19.38-3.82 33.62-10.32 44.87-6.28 10.88-18.52 21.75-39.11 21.75-12.8 0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27 0-22.69 8.61-31.41 21.78z" fill="#0064e1" />
      <path d="M82.35 31.23c-12.27 0-22.69 8.61-31.41 21.78-12.33 18.61-19.88 46.33-19.88 72.95 0 10.98 2.41 19.41 5.56 24.51l-26.48 17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z" fill="#0064e0" />
    </svg>
  );
}

export function MistralIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129 91" width="20" height="14" fill="none" {...props}>
      <rect x="18.292" y="0" width="18.293" height="18.123" fill="#ffd800" />
      <rect x="91.473" y="0" width="18.293" height="18.123" fill="#ffd800" />
      <rect x="18.292" y="18.121" width="36.586" height="18.123" fill="#ffaf00" />
      <rect x="73.181" y="18.121" width="36.586" height="18.123" fill="#ffaf00" />
      <rect x="18.292" y="36.243" width="91.476" height="18.122" fill="#ff8205" />
      <rect x="18.292" y="54.37" width="18.293" height="18.123" fill="#fa500f" />
      <rect x="54.883" y="54.37" width="18.293" height="18.123" fill="#fa500f" />
      <rect x="91.473" y="54.37" width="18.293" height="18.123" fill="#fa500f" />
      <rect x="0" y="72.504" width="54.89" height="18.123" fill="#e10500" />
      <rect x="73.181" y="72.504" width="54.89" height="18.123" fill="#e10500" />
    </svg>
  );
}

export function QwenIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34z" fill="#6F69F7" />
    </svg>
  );
}

export function NvidiaIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="35 31 352 259" width="20" height="14" fill="none" {...props}>
      <path d="M82.211 102.414s22.504-33.203 67.437-36.638V53.73c-49.769 3.997-92.867 46.149-92.867 46.149s24.41 70.564 92.867 77.026v-12.804c-50.237-6.32-67.437-61.687-67.437-61.687zm67.437 36.223v11.727c-37.968-6.77-48.507-46.237-48.507-46.237s18.23-20.195 48.507-23.47v12.867c-.023 0-.039-.007-.058-.007-15.891-1.907-28.305 12.938-28.305 12.938s6.958 24.99 28.363 32.182m0-107.125V53.73c1.461-.112 2.922-.207 4.391-.257 56.582-1.907 93.449 46.406 93.449 46.406s-42.343 51.488-86.457 51.488c-4.043 0-7.828-.375-11.383-1.005v13.739a75.04 75.04 0 009.481.612c41.051 0 70.738-20.965 99.484-45.778 4.766 3.817 24.278 13.103 28.289 17.167-27.332 22.884-91.031 41.33-127.144 41.33-3.481 0-6.824-.211-10.11-.528v19.306H305.68V31.512H149.648zm0 49.144V65.777c1.446-.101 2.903-.179 4.391-.226 40.688-1.278 67.382 34.965 67.382 34.965s-28.832 40.042-59.746 40.042c-4.449 0-8.438-.715-12.028-1.922V93.523c15.84 1.914 19.028 8.911 28.551 24.786l21.181-17.859s-15.461-20.277-41.524-20.277c-2.834-.001-5.545.198-8.207.483" fill="#76B900" />
    </svg>
  );
}

// Generic provider icon — colored rounded rect with a single letter
function GenericProviderIcon({ letter, color, ...props }: IconProps & { letter: string; color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" rx="4" fill={color} />
      <text x="12" y="16" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">{letter}</text>
    </svg>
  );
}

export function StepFunIcon(props: IconProps) { return <GenericProviderIcon letter="S" color="#FF6B35" {...props} />; }
export function AllenAIIcon(props: IconProps) { return <GenericProviderIcon letter="A" color="#2E86AB" {...props} />; }
export function ArceeIcon(props: IconProps) { return <GenericProviderIcon letter="A" color="#8B5CF6" {...props} />; }
export function LiquidAIIcon(props: IconProps) { return <GenericProviderIcon letter="L" color="#06B6D4" {...props} />; }
export function TNGIcon(props: IconProps) { return <GenericProviderIcon letter="T" color="#DC2626" {...props} />; }
export function UpstageIcon(props: IconProps) { return <GenericProviderIcon letter="U" color="#059669" {...props} />; }
export function VeniceIcon(props: IconProps) { return <GenericProviderIcon letter="V" color="#7C3AED" {...props} />; }
export function ZhipuIcon(props: IconProps) { return <GenericProviderIcon letter="Z" color="#2563EB" {...props} />; }

// Map provider names to their icon components
export const PROVIDER_ICONS: Record<string, React.ComponentType<IconProps>> = {
  DeepSeek: DeepSeekIcon,
  OpenAI: OpenAIIcon,
  Anthropic: AnthropicIcon,
  Google: GoogleIcon,
  Meta: MetaIcon,
  Mistral: MistralIcon,
  Qwen: QwenIcon,
  Nvidia: NvidiaIcon,
  StepFun: StepFunIcon,
  AllenAI: AllenAIIcon,
  Arcee: ArceeIcon,
  LiquidAI: LiquidAIIcon,
  TNG: TNGIcon,
  Upstage: UpstageIcon,
  Venice: VeniceIcon,
  Zhipu: ZhipuIcon,
};
