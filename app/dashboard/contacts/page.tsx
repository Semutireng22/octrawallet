"use client";

import { useWalletStore, Contact } from "@/store/wallet-store";
import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, User, Search, Copy, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { copyWithAutoClear } from "@/lib/utils/clipboard";

export default function ContactsPage() {
  const { contacts, addContact, removeContact } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", address: "" });
  const router = useRouter();

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!newContact.name || !newContact.address) {
      toast.error("Please fill in both name and address");
      return;
    }
    if (newContact.address.length < 10) {
      toast.error("Invalid address format");
      return;
    }

    addContact({
      id: uuidv4(),
      name: newContact.name,
      address: newContact.address,
    });
    setNewContact({ name: "", address: "" });
    setIsAdding(false);
    toast.success("Contact added successfully");
  };

  return (
    <AppShell>
      <div className="space-y-8 pt-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-space text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              Address Book
            </h1>
            <p className="text-slate-400">
              Manage your trusted contacts for quick transfers.
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant="gold"
            className="rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Contact
          </Button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="overflow-hidden"
            >
              <Card className="p-8 glass-premium border-yellow-500/20 mb-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                  <User className="w-32 h-32 text-yellow-500" />
                </div>

                <h3 className="font-bold text-xl text-white mb-6 font-space flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-yellow-500" />
                  </div>
                  New Contact
                </h3>

                <div className="grid gap-6 md:grid-cols-2 mb-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-xs text-yellow-500 font-bold uppercase tracking-widest ml-1">
                      Name
                    </label>
                    <Input
                      placeholder="e.g. Alice"
                      className="bg-black/40 border-white/10 h-12 rounded-xl focus:border-yellow-500/50 focus:ring-yellow-500/20"
                      value={newContact.name}
                      onChange={(e) =>
                        setNewContact({ ...newContact, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-yellow-500 font-bold uppercase tracking-widest ml-1">
                      Wallet Address
                    </label>
                    <Input
                      placeholder="0x..."
                      className="bg-black/40 border-white/10 font-mono h-12 rounded-xl focus:border-yellow-500/50 focus:ring-yellow-500/20"
                      value={newContact.address}
                      onChange={(e) =>
                        setNewContact({
                          ...newContact,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 relative z-10">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAdding(false)}
                    className="hover:text-red-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    variant="gold"
                    className="min-w-[120px]"
                  >
                    Save Contact
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative bg-[#0A0A0A] rounded-xl flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
            <Input
              placeholder="Search by name or address..."
              className="pl-12 bg-transparent border-white/5 h-14 rounded-xl text-white placeholder:text-slate-600 focus:ring-0 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <User className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 text-lg font-space">
                No contacts found
              </p>
              <p className="text-slate-600 text-sm">
                Add a new contact to get started
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <Card className="group relative p-0 overflow-hidden border-white/5 bg-gradient-to-br from-white/5 to-white/[0.02] hover:bg-white/10 transition-all duration-300 rounded-3xl hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] border-t border-white/10">
                  {/* Decorative Gradient Blob */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full group-hover:bg-yellow-500/20 transition-all duration-500" />

                  <div className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-yellow-500/20">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all -mr-2 -mt-2"
                        onClick={() => {
                          removeContact(contact.id);
                          toast.success("Contact removed");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <h4 className="font-bold text-xl text-white mb-1 group-hover:text-yellow-500 transition-colors font-space flex items-center gap-2">
                      {contact.name}
                    </h4>

                    <div
                      className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1.5 w-fit border border-white/5 cursor-pointer hover:bg-black/60 transition-colors mb-6 group/addr"
                      onClick={() => {
                        copyWithAutoClear(contact.address);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <p className="text-xs text-slate-400 font-mono">
                        {contact.address.slice(0, 10)}...
                        {contact.address.slice(-8)}
                      </p>
                      <div className="opacity-0 group-hover/addr:opacity-100 transition-opacity">
                        <Copy className="w-3 h-3 text-yellow-500" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                        onClick={() => {
                          copyWithAutoClear(contact.address);
                          toast.success("Address copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 font-bold shadow-lg shadow-yellow-500/20"
                        onClick={() => {
                          // Correct Navigation
                          router.push(`/dashboard/send?to=${contact.address}`);
                        }}
                      >
                        Send <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
