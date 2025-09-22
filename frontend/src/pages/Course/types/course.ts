// export type TestLite = {
//   _id: string;
//   name?: string;
//   title?: string;
//   type: string;
// };

// export type SectionTest = {
//   _id: string; // ✅ Optional because new tests won’t have an ID yet
//   sectionId?: string;
//   testId?: string;
//   order: number;
//   type: string;

//   /** ✅ Flags for backend compatibility */
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
//   isLocal?:boolean
// };

// export type Section = {
//   _id: string; // ✅ Optional for new sections
//   moduleId?: string;
//   sectionName: string;
//   sectionDescription?: string;
//   order: number;
//   tests?: SectionTest[];

//   /** ✅ Flags for backend compatibility */
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
//     isLocal?:boolean

// };

// export type ModuleItem = {
//   _id: string; // ✅ Optional for new modules
//   courseId: string;
//   moduleName: string;
//   moduleDescription?: string;
//   order: number;
//   sections?: Section[];

//   /** ✅ Flags for backend compatibility */
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
//     isLocal?:boolean

// };


// types/course.ts

export type TestLite = {
  _id: string;
  name?: string;
  title?: string;
  type: string;
};

/**
 * Local representation of Test Configuration
 * Mirrors backend model but with flags for staged save.
 */
export type TestConfigurationLocal = {
  _id?: string;
  testId?: string;
  courseId?: string;

  startTime?: string;
  endTime?: string;
  durationInMinutes?: number;
  maxAttempts?: number;
  isRetakeAllowed?: boolean;
  isPreparationTest?: boolean;

  isProctored?: boolean;
  malpracticeLimit?: number;

  correctMark?: number;
  negativeMark?: number;
  passPercentage?: number;

  createdBy?: string;
  lastUpdatedBy?: string;

  // staging metadata (optional)
  lastSavedAt?: string;

  // ✅ Flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;
};

/**
 * Local representation of Test Visibility
 * Mirrors backend model but with flags for staged save.
 */
export type TestVisibilityLocal = {
  _id?: string;
  testId?: string;
  courseId?: string;

  includeGroups?: string[];
  excludeGroups?: string[];
  includeCandidates?: string[];
  excludeCandidates?: string[];

  createdBy?: string;
  lastUpdatedBy?: string;

  // ✅ Flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;
};

export type SectionTest = {
  _id: string; // temp or real id
  sectionId?: string;
  testId?: string;
  order: number;
  type: string;

  // ✅ Flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;

  // ✅ Attach config & visibility for this test
  configuration?: TestConfigurationLocal;
  visibility?: TestVisibilityLocal;
};


export type Section = {
  _id: string;
  moduleId?: string;
  sectionName: string;
  sectionDescription?: string;
  order: number;
  tests?: SectionTest[];

  // ✅ Flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;
};

export type ModuleItem = {
  _id: string;
  courseId: string;
  moduleName: string;
  moduleDescription?: string;
  order: number;
  sections?: Section[];

  // ✅ Flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;
};


export type TestConfig = TestConfigurationLocal;
export type TestVisibility = TestVisibilityLocal;