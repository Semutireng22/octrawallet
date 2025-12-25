"use client";

import { useWalletStore, Contact } from "@/store/wallet-store";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, BookUser } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface ContactPickerProps {
  onSelect: (address: string) => void;
  trigger?: React.ReactNode;
}

export function ContactPicker({ onSelect, trigger }: ContactPickerProps) {
  const { contacts } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (address: string) => {
    onSelect(address);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
            title="Contacts"
          >
            <BookUser className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#0A0A0A] border-white/10 text-white p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
          <DialogTitle className="font-space text-xl font-bold flex items-center gap-2">
            <BookUser className="w-5 h-5 text-yellow-500" />
            Select Contact
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black/40 border-white/10 pl-10 h-10 focus:ring-yellow-500/50"
            />
          </div>
        </div>

        <ScrollArea className="h-[300px] p-2">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 space-y-2 text-center">
              <User className="w-10 h-10 opacity-20" />
              <p className="text-sm">No contacts found.</p>
              {contacts.length === 0 && (
                <p className="text-xs text-slate-600">
                  Add contacts in the Address Book first.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 0.98 }}
                  onClick={() => handleSelect(contact.address)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-yellow-500/20 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white group-hover:text-yellow-400 transition-colors truncate">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {contact.address}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
