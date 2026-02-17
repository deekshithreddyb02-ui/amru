import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Loader2, LogIn, Paperclip, FileText, Image as ImageIcon, Phone, ChevronUp, Bot } from "lucide-react";
import logoImg from "@/assets/logo-optimized.webp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useOfficeContacts, OfficeContact } from "@/hooks/useOfficeContacts";
type Attachment = {
  name: string;
  url: string;
  type: string;
};
type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your water solutions assistant. How can I help you today with rainwater harvesting, groundwater surveys, or any other water-related queries?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    offices
  } = useOfficeContacts();
  const [showContactMenu, setShowContactMenu] = useState(false);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("Please log in to upload files.");
      return;
    }
    const file = files[0];

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only images (JPG, PNG, WebP) and PDFs are allowed.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB.");
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from("main").upload(`chat-uploads/${fileName}`, file);
      if (uploadError) throw uploadError;

      // Use signed URL instead of public URL for security
      const {
        data: signedUrlData,
        error: signError
      } = await supabase.storage.from("main").createSignedUrl(`chat-uploads/${fileName}`, 3600); // 1 hour expiry

      if (signError) throw signError;
      setAttachments(prev => [...prev, {
        name: file.name,
        url: signedUrlData.signedUrl,
        type: file.type
      }]);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const streamChat = async (userMessages: Message[]) => {
    // Get current session for auth token
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Please log in to use the chat assistant.");
    }

    // Format messages for the API - include attachment info in content
    const formattedMessages = userMessages.map(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        const attachmentInfo = msg.attachments.map(a => `[Attached file: ${a.name} (${a.type})]`).join("\n");
        return {
          role: msg.role,
          content: `${msg.content}\n\n${attachmentInfo}`
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        messages: formattedMessages
      })
    });
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        throw new Error("Authentication required. Please log in to continue.");
      }
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (resp.status === 402) {
        throw new Error("Service temporarily unavailable.");
      }
      throw new Error(errorData.error || "Failed to get response");
    }
    if (!resp.body) throw new Error("No response body");
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, {
        stream: true
      });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) => i === prev.length - 1 ? {
                  ...m,
                  content: assistantContent
                } : m);
              }
              return [...prev, {
                role: "assistant",
                content: assistantContent
              }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };
  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0 || isLoading) return;
    if (!user) {
      toast.error("Please log in to use the chat assistant.");
      return;
    }
    const userMessage: Message = {
      role: "user",
      content: input.trim() || (attachments.length > 0 ? "I've attached a file for you to review." : ""),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    try {
      await streamChat(newMessages.slice(1)); // Skip initial greeting
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again or contact us directly at +91-741-0030-418."
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-3 h-3" />;
    }
    return <FileText className="w-3 h-3" />;
  };
  return <>
      {/* Contact Menu Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          {showContactMenu && <motion.div initial={{
          opacity: 0,
          y: 10,
          scale: 0.95
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} exit={{
          opacity: 0,
          y: 10,
          scale: 0.95
        }} transition={{
          duration: 0.2
        }} className="absolute bottom-16 right-0 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden mb-2">
              <div className="text-white px-4 py-2.5 font-semibold text-sm flex items-center justify-between bg-primary">
                <span>Contact Us</span>
                <button onClick={() => setShowContactMenu(false)} className="hover:opacity-80">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {offices.map((office, i) => <div key={i} className="p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">{office.city}</p>
                    <div className="flex gap-2">
                      <a href={`https://wa.me/${office.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#25D366] rounded-lg px-2.5 py-2 hover:bg-[#25D366]/20 transition-colors font-medium">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                      <a href={`tel:${office.phone.replace(/[^+\d]/g, '')}`} className="flex-1 flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded-lg px-2.5 py-2 hover:bg-primary/20 transition-colors font-medium">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {office.phone}
                      </a>
                    </div>
                  </div>)}
              </div>
            </motion.div>}
        </AnimatePresence>
        <motion.button initial={{
        scale: 0
      }} animate={{
        scale: 1
      }} whileHover={{
        scale: 1.1
      }} whileTap={{
        scale: 0.95
      }} onClick={() => setShowContactMenu(!showContactMenu)} className="w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity bg-primary" aria-label="Contact options">
          {showContactMenu ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        </motion.button>
      </div>

      {/* Chat Toggle Button */}
      <motion.button initial={{
      scale: 0
    }} animate={{
      scale: 1
    }} whileHover={{
      scale: 1.1
    }} whileTap={{
      scale: 0.95
    }} onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity" aria-label={isOpen ? "Close chat" : "Open chat"}>
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} transition={{
        duration: 0.2
      }} className="fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary-foreground/20">
                <img src={logoImg} alt="AMRU" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Water Solutions Assistant</h3>
                <p className="text-xs opacity-80">Ask about our services</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={logoImg} alt="AMRU" className="w-full h-full object-cover" />
                    </div>}
                  <div className="max-w-[80%] flex flex-col gap-1">
                    {/* Show attachments if any */}
                    {message.attachments && message.attachments.length > 0 && <div className="flex flex-wrap gap-1 justify-end">
                        {message.attachments.map((att, attIndex) => <a key={attIndex} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition-colors">
                            {getFileIcon(att.type)}
                            <span className="truncate max-w-[100px]">{att.name}</span>
                          </a>)}
                      </div>}
                    <div className={`px-4 py-2 rounded-2xl text-sm ${message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:my-2 [&>h4]:text-sm [&>h4]:my-1">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                  {message.role === "user" && <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>}
                </motion.div>)}
              {isLoading && messages[messages.length - 1]?.role === "user" && <motion.div initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img src={logoImg} alt="AMRU" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input or Login Prompt */}
            <div className="p-4 border-t border-border">
              {user ? <div className="space-y-2">
                  {/* Attachment Preview */}
                  {attachments.length > 0 && <div className="flex flex-wrap gap-2">
                      {attachments.map((att, index) => <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-xs">
                          {getFileIcon(att.type)}
                          <span className="truncate max-w-[80px]">{att.name}</span>
                          <button onClick={() => removeAttachment(index)} className="ml-1 text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </div>)}
                    </div>}
                  <div className="flex gap-2">
                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileSelect} className="hidden" />
                    {/* Attach button */}
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isUploading} className="rounded-full w-10 h-10 flex-shrink-0">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>
                    <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask about water solutions..." disabled={isLoading} className="flex-1 px-4 py-2 text-sm border border-border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50" />
                    <Button onClick={handleSend} disabled={!input.trim() && attachments.length === 0 || isLoading} size="icon" className="rounded-full w-10 h-10">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div> : <a href="/auth" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  <LogIn className="w-4 h-4" />
                  Log in to chat with our assistant
                </a>}
            </div>
          </motion.div>}
      </AnimatePresence>
    </>;
};
export default ChatBot;