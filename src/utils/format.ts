export const format = {
  currency: (amount: number, currency: string = "VND"): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  date: (
    date: string | Date,
    format: "short" | "long" | "time" = "short"
  ): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    switch (format) {
      case "short":
        // Force dd/mm/yyyy format
        const day = dateObj.getDate().toString().padStart(2, "0");
        const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
      case "long":
        return dateObj.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "time":
        return dateObj.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      default:
        return dateObj.toLocaleDateString("vi-VN");
    }
  },

  dateTime: (date: string | Date): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  time: (time: string): string => {
    // Convert 24h format to 12h format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  },

  duration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  },

  fileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  phone: (phone: string): string => {
    // Format Vietnamese phone number
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
    }
    if (cleaned.length === 11 && cleaned.startsWith("84")) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
    }
    return phone;
  },

  getInitials: (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  },
};
