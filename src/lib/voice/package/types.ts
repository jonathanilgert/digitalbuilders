export type RoutingMode =
  | "new_number_only"
  | "forward_after_hours"
  | "forward_no_answer"
  | "forward_all";

export type Carrier =
  | "Telus"
  | "Bell"
  | "Rogers"
  | "Shaw"
  | "Fido"
  | "Koodo"
  | "Virgin"
  | "RingCentral"
  | "Other"
  | "Not sure";

export type BusinessHours = {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
};

export type TransferTarget = {
  name?: string;
  number: string;
  availability?: string;
};

export type Faq = { question: string; answer: string };

/**
 * Framework-independent input to package generation. Optional intake answers may
 * be omitted or blank; generators omit those clauses rather than inventing data.
 */
export type VoicePackageInput = {
  businessName: string;
  agentName?: string;
  voiceId?: string;
  language?: string;
  model?: string;
  transcriberModel?: string;
  provisionedNumber?: string;

  routingMode?: RoutingMode;
  existingNumber?: string;
  carrier?: Carrier;
  ringsBeforeForward?: number;
  coverage?: "24_7" | "after_hours_only" | "overflow_only" | "overflow_and_after_hours";
  hours?: BusinessHours[];
  holidayCoverage?: boolean;
  seasonalNote?: string;
  hasEmergencies?: boolean;
  emergencyDefinition?: string;

  primaryJob?: "message" | "message_book" | "faq_message" | "faq_book";
  calendarType?: string;
  appointmentLength?: string;
  bookingBuffer?: string;
  bookOutDays?: number;
  bookableServices?: string[];
  assignTo?: string;
  qualifyingQuestions?: string[];
  transferRule?: "never" | "emergencies_only" | "if_caller_asks" | "always_try_first";
  transferTargets?: TransferTarget[];
  neverDo?: string[];

  businessOverview?: string;
  services?: string[];
  servicesNotOffered?: string[];
  serviceAreas?: string[];
  travelLimit?: string;
  pricingPolicy?: "never_quote" | "starting_at_range" | "free_estimate";
  pricingWording?: string;
  paymentMethods?: string[];
  financingOffered?: string;
  credentials?: string[];
  faqs?: Faq[];

  smsTo?: string[];
  emailTo?: string[];
  delivery?: "immediate" | "daily_digest" | "both";
  crmWebhook?: string;
  fallbackNumber?: string;
  accountOwner?: string;

  greeting?: string;
  namePronunciation?: string;
  tone?: number | string;
  recordingNotice?: boolean;
};

export type VapiAssistantConfig = {
  voice: { provider: "vapi"; voiceId: string; version: 2; language: string };
  firstMessage: string;
  transcriber: { provider: "deepgram"; model: string; language: string };
  model: {
    provider: "openai";
    model: string;
    messages: [{ role: "system"; content: string }];
  };
  metadata?: { provisionedNumber: string };
};

export type ForwardingInstructions = {
  markdown: string;
  activationCode?: string;
  deactivationCode?: string;
};

export type VoiceAgentPackage = {
  assistant: VapiAssistantConfig;
  assistantJson: string;
  knowledgeMarkdown: string;
  forwardingMarkdown: string;
  forwardingPdf: Buffer;
  briefMarkdown: string;
  briefPdf: Buffer;
};
