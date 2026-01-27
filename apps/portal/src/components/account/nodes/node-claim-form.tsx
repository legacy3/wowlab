"use client";

import { CheckIcon, DownloadIcon, FlaskConicalIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Center, Divider, HStack, Stack, styled } from "styled-system/jsx";

import {
  Badge,
  Button,
  Card,
  Field,
  Group,
  Input,
  PinInput,
  Slider,
  Text,
} from "@/components/ui";

import { PlatformIcon } from "./platform-icon";

interface ClaimData {
  code: string;
  name: string;
  workers: number;
}

interface NodeClaimFormProps {
  isClaiming?: boolean;
  isVerifying?: boolean;
  onClaim: (data: ClaimData) => Promise<void>;
  onDownloadClick?: () => void;
  onVerify: (code: string) => Promise<VerifyResult | null>;
}

interface VerifyResult {
  maxParallel: number;
  name: string;
  platform: string;
  totalCores: number;
  version: string;
}

export function NodeClaimForm({
  isClaiming = false,
  isVerifying = false,
  onClaim,
  onDownloadClick,
  onVerify,
}: NodeClaimFormProps) {
  const content = useIntlayer("account").claimForm;
  const [code, setCode] = useState<string[]>([]);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [name, setName] = useState("");
  const [workers, setWorkers] = useState([4]);

  const codeString = code.join("");
  const isCodeComplete = codeString.length === 6;

  const handleVerify = async () => {
    if (!isCodeComplete) {
      return;
    }
    
    const result = await onVerify(codeString);
    if (result) {
      setVerifyResult(result);
      setName(result.name);
      setWorkers([Math.max(1, result.maxParallel)]);
    }
  };

  const handleClaim = async () => {
    await onClaim({
      code: codeString,
      name,
      workers: workers[0],
    });
  };

  if (verifyResult) {
    return (
      <Card.Root>
        <Card.Body>
          <Stack gap="5" py="4">
            <Stack gap="1" textAlign="center">
              <Text fontWeight="semibold" textStyle="lg">
                {content.configureYourNode}
              </Text>
              <HStack gap="2" justify="center">
                <Badge variant="surface">
                  <PlatformIcon platform={verifyResult.platform} size={12} />
                  <styled.span textTransform="capitalize" ml="1">
                    {verifyResult.platform}
                  </styled.span>
                </Badge>
                <Badge variant="outline">v{verifyResult.version}</Badge>
              </HStack>
            </Stack>

            <Field.Root>
              <Field.Label>{content.nodeName}</Field.Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={content.nodeNamePlaceholder.value}
              />
            </Field.Root>

            <Field.Root>
              <HStack justify="space-between">
                <Field.Label>{content.workers}</Field.Label>
                <styled.span textStyle="sm" color="fg.muted">
                  {content.workersOfCores({
                    totalCores: verifyResult.totalCores,
                    workers: workers[0],
                  })}
                </styled.span>
              </HStack>
              <Slider.Root
                min={1}
                max={verifyResult.totalCores}
                value={workers}
                onValueChange={(e) => setWorkers(e.value)}
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumbs />
                </Slider.Control>
              </Slider.Root>
              <Field.HelperText>{content.workersHelperText}</Field.HelperText>
            </Field.Root>

            <Button
              w="full"
              onClick={handleClaim}
              loading={isClaiming}
              disabled={!name.trim()}
            >
              {content.claimNode}
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap="6" alignItems="center" textAlign="center" py="4">
          <Stack gap="1">
            <Text fontWeight="semibold" textStyle="lg">
              {content.claimYourNode}
            </Text>
            <Text textStyle="sm" color="fg.muted">
              {content.enterCodeDescription}
            </Text>
          </Stack>

          <PinInput.Root
            variant="surface"
            size="xl"
            type="alphanumeric"
            placeholder=""
            value={code}
            onValueChange={(e) => setCode(e.value.map((v) => v.toUpperCase()))}
          >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <Group attached>
                {[0, 1, 2].map((id) => (
                  <PinInput.Input key={id} index={id} />
                ))}
              </Group>
              <Center px="3">
                <styled.span color="fg.muted" fontWeight="bold">
                  —
                </styled.span>
              </Center>
              <Group attached>
                {[3, 4, 5].map((id) => (
                  <PinInput.Input key={id} index={id} />
                ))}
              </Group>
            </PinInput.Control>
          </PinInput.Root>

          <Button
            w="full"
            onClick={handleVerify}
            disabled={!isCodeComplete}
            loading={isVerifying}
          >
            <FlaskConicalIcon size={16} />
            <CheckIcon size={16} />
            {content.verifyCode}
          </Button>

          {onDownloadClick && (
            <>
              <Divider>
                <styled.span
                  textStyle="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                  fontWeight="medium"
                  letterSpacing="wide"
                >
                  {content.dontHaveTheApp}
                </styled.span>
              </Divider>

              <Button w="full" variant="outline" onClick={onDownloadClick}>
                <DownloadIcon size={16} />
                {content.downloadNode}
              </Button>
            </>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
