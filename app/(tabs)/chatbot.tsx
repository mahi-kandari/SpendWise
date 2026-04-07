import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { handleFinancialAssistantMessage } from "@/services/financialAssistantService";
import { scale, verticalScale } from "@/utils/styling";
import { LinearGradient } from "expo-linear-gradient";
import * as Icons from "phosphor-react-native";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import {
  Bubble,
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";

const BOT_USER = {
  _id: 2,
  name: "Expense Copilot",
};

const CURRENT_USER = {
  _id: 1,
  name: "You",
};

const Chatbot = () => {
  const { user } = useAuth();
  const [composerText, setComposerText] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (newMessages.length > 0) {
        setHasSentFirstMessage(true);
      }

      const userMessage = newMessages[0]?.text || "";
      setMessages((previous) => GiftedChat.append(previous, newMessages));
      setComposerText("");
      setIsBotTyping(true);

      try {
        const result = await handleFinancialAssistantMessage({
          message: userMessage,
          uid: user?.uid,
          userName: user?.name,
        });

        setMessages((previous) =>
          GiftedChat.append(previous, [
            {
              _id: `${Date.now()}-reply`,
              text: result.reply,
              createdAt: new Date(),
              user: BOT_USER,
            },
          ]),
        );
      } catch (error: any) {
        const errorMessage =
          error?.message || "Unknown error while processing your request.";
        setMessages((previous) =>
          GiftedChat.append(previous, [
            {
              _id: `${Date.now()}-reply-error`,
              text: `I hit an error while processing that request: ${errorMessage}`,
              createdAt: new Date(),
              user: BOT_USER,
            },
          ]),
        );
      } finally {
        setIsBotTyping(false);
      }
    },
    [user?.name, user?.uid],
  );

  const greetingName = (user?.name || "there").toUpperCase();
  const showStartPrompt = !hasSentFirstMessage && messages.length === 0;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header title="Financial Assistant" />
        </View>

        {showStartPrompt && (
          <View style={styles.startPromptContainer}>
            <View style={styles.startPromptContent}>
              <Image
                source={require("@/assets/images/chatbot.png")}
                style={styles.startPromptImage}
                resizeMode="contain"
              />

              <Typo size={20} fontWeight={"500"} style={styles.startPromptText}>
                Hi {greetingName}, I’m your SpendWise assistant. How can I assist you today?
              </Typo>
            </View>
          </View>
        )}

        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={CURRENT_USER}
          text={composerText}
          textInputProps={{
            placeholder: "Ask about your spending, budgets...",
            onChangeText: setComposerText,
          }}
          isSendButtonAlwaysVisible
          isTyping={isBotTyping}
          isAvatarVisibleForEveryMessage={false}
          isScrollToBottomEnabled
          renderAvatar={null}
          isUsernameVisible={false}
          messagesContainerStyle={styles.messagesContainer}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: styles.userBubble,
                left: styles.assistantBubble,
              }}
              textStyle={{
                right: styles.userBubbleText,
                left: styles.assistantBubbleText,
              }}
            />
          )}
          renderTime={() => null}
          renderInputToolbar={(props) => (
            <View>
              <InputToolbar
                {...props}
                containerStyle={styles.toolbarContainer}
                primaryStyle={styles.toolbarPrimary}
              />
            </View>
          )}
          renderComposer={(props) => (
            <Composer
              {...props}
              textInputProps={{
                ...props.textInputProps,
                placeholderTextColor: "rgba(255,255,255,0.5)",
                style: styles.composerInput,
              }}
            />
          )}
          renderSend={(props) => (
            <Send {...props} containerStyle={styles.sendContainer}>
              <LinearGradient
                colors={["#B8FF6A", "#9CFF38"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                <Icons.ArrowUp size={16} color={colors.black} weight="bold" />
              </LinearGradient>
            </Send>
          )}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Chatbot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._12,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacingY._10,
    marginTop: verticalScale(8),
    paddingTop: verticalScale(12),
  },
  startPromptContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._60,
  },
  startPromptContent: {
    alignItems: "center",
    gap: spacingY._12,
  },
  startPromptImage: {
    width: verticalScale(175),
    height: verticalScale(175),
    opacity: 1,
  },
  startPromptText: {
    textAlign: "center",
    lineHeight: scale(30),
    color: colors.white,
  },
  messagesContainer: {
    paddingBottom: spacingY._5,
    paddingTop: spacingY._10,
  },
  assistantBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    borderRadius: radius._20,
    borderTopLeftRadius: radius._10,
    borderWidth: 1,
    borderColor: "rgba(39, 37, 37, 0.9)",
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    //marginVertical: verticalScale(3),
  },
  userBubble: {
    backgroundColor: "#A3FF3F",
    borderRadius: radius._20,
    borderTopRightRadius: radius._10,
    borderWidth: 1,
    borderColor: "rgba(163,255,63,0.65)",
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    //marginVertical: verticalScale(3),
  },
  assistantBubbleText: {
    color: "#EAEAEA",
    fontSize: scale(16),
    lineHeight: scale(20),
  },
  userBubbleText: {
    color: "#212515",
    fontSize: scale(16),
    lineHeight: scale(20),
  },

  toolbarContainer: {
    borderTopWidth: 2,
    borderRadius: radius._20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 2,
    borderColor: "rgba(163,255,63,0.45)",
    paddingLeft: spacingX._10,
    paddingRight: spacingX._5,
    paddingTop: spacingY._5,
    paddingBottom: spacingY._5,
    shadowColor: "rgba(163,255,63,0.45)",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  toolbarPrimary: {
    alignItems: "center",
  },
  composerInput: {
    color: "#EAEAEA",
    fontSize: scale(14),
    lineHeight: scale(20),
    marginLeft: spacingX._5,
    marginRight: spacingX._7,
    paddingTop: spacingY._7,
    paddingBottom: spacingY._7,
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._3,
    marginBottom: spacingY._5,
  },
  sendButton: {
    height: verticalScale(34),
    width: verticalScale(34),
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
});
