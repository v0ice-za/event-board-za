// Makes Jest globals (test, expect, describe, jest, ...) available to tsc
// project-wide. Expo's bundler moduleResolution base does not auto-include
// @types/jest, so test files would otherwise fail `tsc --noEmit`. See Story 1.5.
/// <reference types="jest" />
