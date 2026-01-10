import { Flex } from "styled-system/jsx";

import { SignInForm } from "@/components/auth";

export default function SignInPage() {
  return (
    <Flex justify="center" py="12">
      <SignInForm />
    </Flex>
  );
}
