/**
 * Typed models matching the backend API (Django REST Framework).
 * Paginated endpoints wrap results in a Paginated<T> envelope.
 */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- core ---------------------------------------------------------------
export interface SiteSettings {
  site_name: string;
  tagline: string;
  description: string;
  keywords: string;
  logo: string | null;
  favicon: string | null;
  email: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  city: string;
  address: string;
  work_hours: string;
  accent_color: string;
  footer_description: string;
  copyright_text: string;
  meta_title: string;
  meta_description: string;
  analytics_code: string;
  smartcaptcha_client_key: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  platform_label: string;
  label: string;
  url: string;
  icon: string;
}

export interface Hero {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  image: string | null;
  typed_words: string[];
  primary_btn_text: string;
  primary_btn_url: string;
  secondary_btn_text: string;
  secondary_btn_url: string;
}

export interface About {
  title: string;
  lead: string;
  text: string;
  image: string | null;
  resume_url: string;
  highlights: string[];
}

export interface Stat {
  id: number;
  value: string;
  label: string;
  icon: string;
}

export interface Site {
  settings: SiteSettings;
  hero: Hero;
  about: About;
  stats: Stat[];
  socials: SocialLink[];
}

// --- services ------------------------------------------------------------
export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  icon: string;
  image: string | null;
  price: number | null;
  price_from: number | null;
  price_type: 'fixed' | 'from' | 'negotiable';
  price_type_label: string;
  duration: string;
  features: string[];
  stack: string[];
  is_featured: boolean;
  category: ServiceCategory | null;
  category_slug: string | null;
}

export interface Technology {
  id: number;
  name: string;
  icon: string;
  category: string;
  category_label: string;
  proficiency: number;
}

export interface PricingPlan {
  id: number;
  name: string;
  price: number | null;
  currency: string;
  period: string;
  badge: string;
  description: string;
  features: string[];
  is_popular: boolean;
  service: number | null;
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

// --- projects ------------------------------------------------------------
export interface ProjectTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProjectImage {
  id: number;
  image: string;
  alt: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  client: string;
  short_description: string;
  description: string;
  year: number | null;
  cover: string | null;
  url: string;
  repository_url: string;
  tags: ProjectTag[];
  stack: string[];
  results: string[];
  is_featured: boolean;
  images: ProjectImage[];
}

// --- testimonials / skills / blog / faq ----------------------------------
export interface Testimonial {
  id: number;
  author: string;
  position: string;
  company: string;
  photo: string | null;
  text: string;
  rating: number;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
  years: number | null;
  icon: string;
}

export interface SkillGroup {
  id: number;
  name: string;
  icon: string;
  skills: Skill[];
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string | null;
  tags: string[];
  reading_time: number;
  published_at: string | null;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  items: FAQItem[];
}

export interface BudgetRange {
  id: number;
  label: string;
}

// --- chat ----------------------------------------------------------------
export interface ChatMessage {
  id: number;
  direction: 'incoming' | 'outgoing';
  text: string;
  created_at: string;
}

// --- lead payloads -------------------------------------------------------
export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  consent: boolean;
  smart_token?: string;
}

export interface CallbackPayload {
  name: string;
  phone: string;
  message?: string;
  consent: boolean;
  smart_token?: string;
}

export interface OrderPayload {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  consent: boolean;
  smart_token?: string;
}

export interface BriefPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  budget?: number | null;
  deadline?: string;
  message?: string;
  consent: boolean;
  smart_token?: string;
}

export interface ConsultationPayload {
  name: string;
  phone: string;
  message?: string;
  consent: boolean;
  smart_token?: string;
}

export interface SubscribePayload {
  email: string;
  consent: boolean;
  smart_token?: string;
}
